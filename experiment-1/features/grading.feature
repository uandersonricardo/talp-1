Feature: Grading and Class Report
  As a professor
  I want to grade student responses against an answer key
  So that I can produce a class performance report

  Background:
    Given an exam was generated with 3 questions in "letters" mode
    And the answer key CSV has the following rows:
      | exam_number | Q1 | Q2 | Q3 |
      | 1           | A  | BC | D  |
      | 2           | C  | A  | BD |

  # --- Strict Grading ---

  Scenario: Strict grading — student answer exactly matches the key
    Given grading mode is "strict"
    And the student responses CSV contains:
      | exam_number | Q1 | Q2 | Q3 |
      | 1           | A  | BC | D  |
    When I submit the grading request
    Then the class report shows a total score of 3 for exam_number 1

  Scenario: Strict grading — one answer is wrong
    Given grading mode is "strict"
    And the student responses CSV contains:
      | exam_number | Q1 | Q2 | Q3 |
      | 1           | B  | BC | D  |
    When I submit the grading request
    Then Q1 score is 0 for exam_number 1
    And Q2 score is 1 for exam_number 1
    And Q3 score is 1 for exam_number 1
    And the total score is 2 for exam_number 1

  Scenario: Strict grading — partial selection of a multi-correct question scores 0
    Given grading mode is "strict"
    And the student responses CSV contains:
      | exam_number | Q1 | Q2 | Q3 |
      | 1           | A  | B  | D  |
    When I submit the grading request
    Then Q2 score is 0 for exam_number 1
    And the total score is 2 for exam_number 1

  Scenario: Strict grading — empty answer scores 0
    Given grading mode is "strict"
    And the student responses CSV contains:
      | exam_number | Q1 | Q2 | Q3 |
      | 1           | A  |    | D  |
    When I submit the grading request
    Then Q2 score is 0 for exam_number 1

  # --- Lenient Grading ---

  Scenario: Lenient grading — all alternatives correctly identified
    Given grading mode is "lenient"
    And question Q2 has 4 alternatives total with correct alternatives B and C
    And the student responses CSV contains:
      | exam_number | Q2 |
      | 1           | BC |
    When I submit the grading request
    Then Q2 score is 1.0 for exam_number 1

  Scenario: Lenient grading — one extra incorrect alternative selected
    Given grading mode is "lenient"
    And question Q2 has 4 alternatives total with correct alternatives B and C
    And the student responses CSV contains:
      | exam_number | Q2 |
      | 1           | ABC |
    When I submit the grading request
    Then Q2 score is 0.75 for exam_number 1

  Scenario: Lenient grading — one correct alternative missed
    Given grading mode is "lenient"
    And question Q2 has 4 alternatives total with correct alternatives B and C
    And the student responses CSV contains:
      | exam_number | Q2 |
      | 1           | B  |
    When I submit the grading request
    Then Q2 score is 0.75 for exam_number 1

  Scenario: Lenient grading — empty answer with one correct alternative out of 4
    Given grading mode is "lenient"
    And question Q1 has 4 alternatives total with correct alternative A
    And the student responses CSV contains:
      | exam_number | Q1 |
      | 1           |    |
    When I submit the grading request
    Then Q1 score is 0.75 for exam_number 1

  # --- Class Report Output ---

  Scenario: Class report includes per-question scores and total score
    Given grading mode is "strict"
    And the student responses CSV contains:
      | exam_number | Q1 | Q2 | Q3 |
      | 1           | A  | BC | D  |
    When I submit the grading request
    Then the class report CSV has columns: exam_number, Q1, Q2, Q3, total_score

  Scenario: Class report includes student_name when present in responses CSV
    Given the student responses CSV contains a "student_name" column
    When I submit the grading request
    Then the class report CSV includes the "student_name" column

  Scenario: Class report includes cpf when present in responses CSV
    Given the student responses CSV contains a "cpf" column
    When I submit the grading request
    Then the class report CSV includes the "cpf" column

  Scenario: Class report omits student_name when absent from responses CSV
    Given the student responses CSV does not contain a "student_name" column
    When I submit the grading request
    Then the class report CSV does not include the "student_name" column

  # --- Validation ---

  Scenario: Warn when a response exam_number has no matching answer key entry
    Given the student responses CSV contains exam_number 99 which is not in the answer key
    When I submit the grading request
    Then grading completes successfully
    And a warning is shown: "exam_number 99 has no matching entry in the answer key"

  Scenario: Skip rows with no exam_number
    Given the student responses CSV contains a row with no exam_number
    When I submit the grading request
    Then grading completes successfully
    And the row with no exam_number is excluded from the report

  Scenario: Grade multiple students across multiple individual exams
    Given the student responses CSV contains:
      | exam_number | Q1 | Q2 | Q3 |
      | 1           | A  | BC | D  |
      | 2           | C  | A  | BD |
    When I submit the grading request
    Then the class report contains one row for exam_number 1
    And one row for exam_number 2

  # --- Powers Mode ---

  Scenario: Strict grading in powers mode — exact numeric match
    Given an exam was generated with 2 questions in "powers" mode
    And the answer key CSV contains:
      | exam_number | Q1 | Q2 |
      | 1           | 6  | 16 |
    And the student responses CSV contains:
      | exam_number | Q1 | Q2 |
      | 1           | 6  | 16 |
    And grading mode is "strict"
    When I submit the grading request
    Then the total score is 2 for exam_number 1

  Scenario: Strict grading in powers mode — wrong numeric sum scores 0
    Given an exam was generated with 1 question in "powers" mode
    And the answer key CSV contains:
      | exam_number | Q1 |
      | 1           | 6  |
    And the student responses CSV contains:
      | exam_number | Q1 |
      | 1           | 4  |
    And grading mode is "strict"
    When I submit the grading request
    Then the Q1 score is 0 for exam_number 1

  Scenario: Empty powers-mode response scores 0 in strict mode
    Given the answer key CSV contains a Q1 value of "6" for exam_number 1
    And the student responses CSV contains an empty Q1 for exam_number 1
    And grading mode is "strict"
    When I submit the grading request
    Then the Q1 score is 0 for exam_number 1
