Feature: Exam Management
  As a professor
  I want to manage exams composed of questions
  So that I can organize and track assessments

  # --- Create ---

  Scenario: Create an exam in letters identifier mode
    Given questions exist in the system
    When I create an exam with:
      | field           | value              |
      | title           | Midterm Exam       |
      | course          | Biology 101        |
      | professor       | Dr. Smith          |
      | date            | 2026-04-15         |
      | identifier mode | letters            |
    And I select 3 existing questions
    And I submit the form
    Then the exam is saved successfully
    And it appears in the exam list

  Scenario: Create an exam in powers identifier mode
    Given questions exist in the system
    When I create an exam with identifier mode "powers"
    And I select at least one question
    And I submit the form
    Then the exam is saved with identifier mode "powers"

  Scenario: Fail to create an exam with no questions selected
    Given I am on the exam creation page
    When I fill in all required exam fields
    And I do not select any questions
    And I submit the form
    Then I see a validation error "At least one question is required"

  Scenario: Fail to create an exam with a missing required field
    Given I am on the exam creation page
    When I leave the title empty
    And I select at least one question
    And I submit the form
    Then I see a validation error indicating the title is required

  # --- Edit ---

  Scenario: Edit the title of an existing exam
    Given an exam exists with title "Old Title"
    When I edit the exam and change the title to "New Title"
    And I save the changes
    Then the exam is updated with the new title

  Scenario: Edit the question set of an existing exam
    Given an exam exists with 3 questions
    When I edit the exam and add a 4th question
    And I save the changes
    Then the exam has 4 questions

  Scenario: Editing an exam does not affect already-generated individual exams
    Given an exam has at least one generated PDF batch
    When I edit the exam title
    Then the previously generated individual exams are unchanged

  # --- Delete ---

  Scenario: Delete an exam with no generated individual exams
    Given an exam exists with no generated PDF batches
    When I delete the exam
    Then the exam is removed from the exam list

  Scenario: Fail to delete an exam that has generated individual exams
    Given an exam exists with at least one generated PDF batch
    When I attempt to delete the exam
    Then I see an error "Exam cannot be deleted because individual exams have already been generated"
    And the exam remains in the list

  # --- List ---

  Scenario: List exams with pagination
    Given 15 exams exist in the system
    When I navigate to the exam list page
    Then I see the first page of exams
    And pagination controls are displayed

  Scenario: Search exams by title
    Given exams exist with titles "Final Exam" and "Midterm Quiz"
    When I search for "Midterm"
    Then only "Midterm Quiz" appears in the results

  Scenario: Search returns no results for an unmatched term
    Given exams exist in the system
    When I search for "xyznonexistent"
    Then the exam list is empty
    And a "no results" message is displayed
