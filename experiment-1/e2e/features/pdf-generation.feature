Feature: PDF and Answer Key Generation
  As a professor
  I want to generate individual exam PDFs with randomized question order
  So that students receive unique exam layouts that reduce cheating

  # --- Generation ---

  Scenario: Generate individual exams for a letters-mode exam
    Given an exam exists in "letters" identifier mode with 5 questions each having 4 alternatives
    When I request generation of 30 individual exams
    Then 30 PDF files are created
    And an answer key CSV is created with 30 data rows

  Scenario: Generate individual exams for a powers-mode exam
    Given an exam exists in "powers" identifier mode with 4 questions each having 3 alternatives
    When I request generation of 10 individual exams
    Then 10 PDF files are created
    And an answer key CSV is created with 10 data rows

  Scenario: Each individual exam has a unique question order
    Given an exam exists with 5 questions for generation
    When I generate 5 individual exams
    Then no two individual exams share the same question sequence

  Scenario: Each individual exam has a unique alternative order per question
    Given an exam exists with a question having 4 alternatives
    When I generate 4 individual exams
    Then the alternative order differs across individual exams for that question

  # --- PDF Layout ---

  Scenario: Every page of a generated PDF contains the header
    Given a generated individual exam PDF exists
    When I inspect each page of the PDF
    Then each page displays the course, professor, date, and exam title in the header

  Scenario: Every page of a generated PDF contains the sequence number footer
    Given a generated individual exam PDF exists for individual exam number 7
    When I inspect each page of the PDF
    Then the footer on every page shows the sequence number 7

  Scenario: Letters-mode exam PDF shows answer blank labeled "Answer: ___"
    Given a generated individual exam in "letters" mode
    When I inspect the answer blank after each question
    Then each blank is labeled "Answer: ___"

  Scenario: Powers-mode exam PDF shows answer blank labeled "Sum: ___"
    Given a generated individual exam in "powers" mode
    When I inspect the answer blank after each question
    Then each blank is labeled "Sum: ___"

  Scenario: PDF final page contains student name and CPF fields
    Given a generated individual exam PDF
    When I inspect the last page
    Then I see fields for student name and CPF

  # --- Answer Key CSV ---

  Scenario: Answer key CSV columns follow canonical question order
    Given an exam with questions in a defined order [Q1, Q2, Q3]
    When I generate 2 individual exams and download the answer key CSV
    Then the CSV columns are: exam_number, Q1, Q2, Q3
    And the order matches the exam's original question list regardless of shuffling

  Scenario: Answer key CSV letters-mode cell contains correct alternative letters
    Given a generated individual exam in "letters" mode
    And in that exam, question Q1 has its correct alternative shuffled to position "B"
    When I inspect the answer key CSV row for that individual exam
    Then the Q1 cell contains "B"

  Scenario: Answer key CSV letters-mode cell contains multiple letters for multi-correct question
    Given a generated individual exam in "letters" mode
    And question Q2 has two correct alternatives shuffled to positions "A" and "C"
    When I inspect the answer key CSV row for that individual exam
    Then the Q2 cell contains "AC"

  Scenario: Answer key CSV powers-mode cell contains sum of correct alternative powers
    Given a generated individual exam in "powers" mode
    And question Q1 has correct alternatives assigned powers 2 and 8 in their shuffled positions
    When I inspect the answer key CSV row for that individual exam
    Then the Q1 cell contains "10"

  # --- Idempotent Batching ---

  Scenario: Re-generating exams creates a new batch with continuing sequence numbers
    Given an exam already has a batch of 5 individual exams
    When I generate 3 more individual exams
    Then the new individual exams are numbered 6, 7, and 8
    And the previous individual exams remain unchanged

  # --- Download ---

  Scenario: PDF and CSV are available for download immediately after generation
    Given I have just generated 10 individual exams
    Then a download link for the PDF is available
    And a download link for the answer key CSV is available

  # --- Performance ---

  Scenario: Generate 200 individual exams without timeout
    Given an exam exists with 10 questions for generation
    When I request generation of 200 individual exams
    Then all 200 PDFs are created successfully within an acceptable time limit
    And the answer key CSV contains 200 rows
