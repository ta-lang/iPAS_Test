import unittest

from question_identity import enrich_questions, make_content_hash, make_question_uid


class QuestionIdentityTests(unittest.TestCase):
    def setUp(self):
        self.question = {
            "subject": "L11 人工智慧基礎概論",
            "chapter": "官方樣題範例",
            "num": 21,
            "question": "模型是否公平？",
            "options": ["甲", "乙", "丙", "丁"],
            "answer": "B",
            "ans_text": "標準答案：(B)",
            "explanation": "原始解析",
        }

    def test_content_change_does_not_change_question_uid(self):
        revised = {**self.question, "question": "模型是否具備公平性？"}

        original_uid = make_question_uid("ai", self.question)
        revised_uid = make_question_uid("ai", revised)

        self.assertEqual(original_uid, revised_uid)
        self.assertNotEqual(make_content_hash(self.question), make_content_hash(revised))

    def test_same_number_in_different_chapter_gets_different_uid(self):
        another = {**self.question, "chapter": "115年第一次歷屆考題"}

        self.assertNotEqual(
            make_question_uid("ai", self.question),
            make_question_uid("ai", another),
        )

    def test_enrich_questions_adds_traceable_fields_and_keeps_display_number(self):
        enriched = enrich_questions("ai", [self.question], source_version="114.09")

        self.assertEqual(len(enriched), 1)
        self.assertEqual(enriched[0]["num"], 21)
        self.assertEqual(enriched[0]["display_num"], 21)
        self.assertEqual(enriched[0]["source_version"], "114.09")
        self.assertTrue(enriched[0]["source_id"].startswith("ai-"))
        self.assertTrue(enriched[0]["question_uid"].startswith("ai-"))
        self.assertEqual(len(enriched[0]["content_hash"]), 64)

    def test_enrich_questions_rejects_duplicate_identity(self):
        with self.assertRaisesRegex(ValueError, "duplicate question_uid"):
            enrich_questions(
                "ai",
                [self.question, dict(self.question)],
                source_version="test",
            )


if __name__ == "__main__":
    unittest.main()
