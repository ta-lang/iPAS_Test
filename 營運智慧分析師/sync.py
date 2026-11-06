import os
import sys
import time
import datetime
import email.utils
import logging
import requests
import gdown

# Configure logging to console and sync.log
script_dir = os.path.dirname(os.path.abspath(__file__))
log_file = os.path.join(script_dir, "sync.log")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(log_file, encoding="utf-8"),
        logging.StreamHandler(sys.stdout)
    ]
)

FOLDER_URL = "https://drive.google.com/drive/folders/1LQFKKcQW6dNKKBV2B2uCMMS9S_1sRtEY"
OUTPUT_DIR = r"c:\Drive224\Projects\iPAS 證照\營運智慧分析師"

sess = requests.Session()
sess.headers.update({
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36"
})

def get_remote_file_metadata(file_id):
    """Fetches remote file's Content-Length and Last-Modified time."""
    url = f"https://drive.google.com/uc?id={file_id}"
    try:
        res = sess.get(url, stream=True, allow_redirects=True, timeout=15)
        if res.status_code == 200:
            content_type = res.headers.get("Content-Type", "")
            if "text/html" in content_type:
                # If it's HTML, it could be a Google Doc or a large file warning page.
                # Attempt to get the direct confirmation URL
                from gdown.download import get_url_from_gdrive_confirmation
                try:
                    confirm_url = get_url_from_gdrive_confirmation(res.text)
                    res_confirm = sess.get(confirm_url, stream=True, allow_redirects=True, timeout=15)
                    if res_confirm.status_code == 200:
                        res.close()
                        res = res_confirm
                except Exception:
                    pass
            
            length = res.headers.get("Content-Length")
            mtime_str = res.headers.get("Last-Modified")
            length = int(length) if length is not None else None
            mtime = email.utils.parsedate_to_datetime(mtime_str) if mtime_str else None
            res.close()
            return length, mtime
    except Exception as e:
        logging.error(f"Failed to fetch metadata for file ID {file_id}: {e}")
    return None, None

def get_resolved_local_path(f):
    """Resolves the correct local path for Google Docs/Sheets/Slides if they have no extension."""
    local_path = f.local_path
    if not os.path.splitext(local_path)[1]:
        try:
            resolved = gdown.download(
                id=f.id,
                output=os.path.dirname(local_path) + os.sep,
                skip_download=True,
                quiet=True
            )
            if resolved and hasattr(resolved, 'local_path'):
                return os.path.abspath(resolved.local_path)
        except Exception as e:
            logging.error(f"Failed to resolve extension for {f.path}: {e}")
    return os.path.abspath(local_path)

def sync():
    logging.info("=========================================")
    logging.info("Starting Google Drive synchronization...")
    logging.info(f"Target folder URL: {FOLDER_URL}")
    logging.info(f"Destination dir:   {OUTPUT_DIR}")
    
    try:
        remote_files = gdown.download_folder(url=FOLDER_URL, output=OUTPUT_DIR, skip_download=True, quiet=True)
    except Exception as e:
        logging.critical(f"Failed to retrieve Google Drive folder structure: {e}")
        return

    logging.info(f"Retrieved {len(remote_files)} remote files from Google Drive.")
    
    remote_paths = set()
    downloaded_count = 0
    skipped_count = 0
    updated_count = 0
    failed_count = 0
    local_dirs = set()

    for f in remote_files:
        # Resolve true local path (handling native Google documents)
        local_path = get_resolved_local_path(f)
        remote_paths.add(local_path)
        
        # Ensure parent directories exist
        parent_dir = os.path.dirname(local_path)
        if parent_dir:
            os.makedirs(parent_dir, exist_ok=True)
            local_dirs.add(os.path.abspath(parent_dir))

        # Check if local file exists
        if not os.path.exists(local_path):
            logging.info(f"[NEW] {f.path} -> Downloading...")
            try:
                gdown.download(id=f.id, output=local_path, quiet=True, resume=False)
                # Apply remote modification time
                _, remote_mtime = get_remote_file_metadata(f.id)
                if remote_mtime:
                    t = remote_mtime.timestamp()
                    os.utime(local_path, (t, t))
                logging.info(f"Successfully downloaded: {f.path}")
                downloaded_count += 1
            except Exception as e:
                logging.error(f"Failed to download {f.path}: {e}")
                failed_count += 1
        else:
            # File exists. Compare size and mtime.
            remote_size, remote_mtime = get_remote_file_metadata(f.id)
            if remote_size is None or remote_mtime is None:
                logging.warning(f"Could not check metadata for {f.path}. Force downloading to be safe...")
                try:
                    gdown.download(id=f.id, output=local_path, quiet=True, resume=False)
                    logging.info(f"Successfully force-downloaded: {f.path}")
                    updated_count += 1
                except Exception as e:
                    logging.error(f"Failed to force-download {f.path}: {e}")
                    failed_count += 1
                continue

            local_size = os.path.getsize(local_path)
            local_mtime = datetime.datetime.fromtimestamp(os.path.getmtime(local_path), tz=datetime.timezone.utc)
            
            delta = abs((remote_mtime - local_mtime).total_seconds())
            
            if local_size != remote_size or delta > 5.0:
                logging.info(f"[UPDATE] {f.path} -> Modifying locally (Size: {local_size} vs {remote_size}, Mtime diff: {delta:.1f}s)")
                try:
                    gdown.download(id=f.id, output=local_path, quiet=True, resume=False)
                    t = remote_mtime.timestamp()
                    os.utime(local_path, (t, t))
                    logging.info(f"Successfully updated: {f.path}")
                    updated_count += 1
                except Exception as e:
                    logging.error(f"Failed to update {f.path}: {e}")
                    failed_count += 1
            else:
                skipped_count += 1

    # Cleanup obsolete local files
    deleted_count = 0
    synced_root_folders = set()
    for f in remote_files:
        rel = os.path.relpath(f.local_path, OUTPUT_DIR)
        parts = rel.split(os.sep)
        if parts:
            synced_root_folders.add(os.path.join(OUTPUT_DIR, parts[0]))

    for sync_root in synced_root_folders:
        if not os.path.exists(sync_root):
            continue
        for root, dirs, files_in_dir in os.walk(sync_root, topdown=False):
            for file in files_in_dir:
                full_path = os.path.abspath(os.path.join(root, file))
                if full_path not in remote_paths:
                    logging.info(f"[DELETE] Removing obsolete local file: {full_path}")
                    try:
                        os.remove(full_path)
                        deleted_count += 1
                    except Exception as e:
                        logging.error(f"Failed to delete {full_path}: {e}")
            
            for d in dirs:
                dir_path = os.path.abspath(os.path.join(root, d))
                if dir_path not in local_dirs:
                    try:
                        if not os.listdir(dir_path):
                            logging.info(f"[DELETE] Removing empty directory: {dir_path}")
                            os.rmdir(dir_path)
                    except Exception:
                        pass

    logging.info("Sync complete. Summary:")
    logging.info(f"  - New:      {downloaded_count}")
    logging.info(f"  - Updated:  {updated_count}")
    logging.info(f"  - Skipped:  {skipped_count}")
    logging.info(f"  - Deleted:  {deleted_count}")
    logging.info(f"  - Failed:   {failed_count}")
    logging.info("=========================================")

if __name__ == "__main__":
    sync()
