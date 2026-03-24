Feature: Question Management
  As a professor
  I want to manage multiple-choice questions
  So that I can build a question bank for exams

  # --- Create ---

  Scenario: Create a question with one correct alternative
    Given I am on the question creation page
    When I fill in the statement with "What is the capital of France?"
    And I add an alternative "Paris" marked as correct
    And I add an alternative "London" marked as incorrect
    And I submit the form
    Then the question is saved successfully
    And it appears in the question list

  Scenario: Create a question with multiple correct alternatives
    Given I am on the question creation page
    When I fill in the statement with "Which of the following are prime numbers?"
    And I add an alternative "2" marked as correct
    And I add an alternative "3" marked as correct
    And I add an alternative "4" marked as incorrect
    And I submit the form
    Then the question is saved successfully

  Scenario: Fail to create a question with only one alternative
    Given I am on the question creation page
    When I fill in the statement with "Single alt question"
    And I add an alternative "Only option" marked as correct
    And I attempt to submit the form
    Then I see a validation error "At least two alternatives are required"

  Scenario: Fail to create a question with no correct alternative
    Given I am on the question creation page
    When I fill in the statement with "No correct answer question"
    And I add an alternative "Option A" marked as incorrect
    And I add an alternative "Option B" marked as incorrect
    And I attempt to submit the form
    Then I see a validation error "At least one alternative must be marked as correct"

  Scenario: Fail to create a question with an empty statement
    Given I am on the question creation page
    When I leave the statement empty
    And I add an alternative "Option A" marked as correct
    And I add an alternative "Option B" marked as incorrect
    And I attempt to submit the form
    Then I see a validation error indicating the statement is required

  # --- Edit ---

  Scenario: Edit the statement of an existing question
    Given a question exists with statement "Old statement"
    When I edit the question and change the statement to "New statement"
    And I save the changes
    Then the question is updated with the new statement

  Scenario: Edit an alternative description
    Given a question exists with an alternative "Incorrct answer"
    When I edit the question and fix the alternative to "Incorrect answer"
    And I save the changes
    Then the alternative is updated

  Scenario: Mark a previously incorrect alternative as correct
    Given a question exists with all alternatives marked as incorrect except one
    When I edit the question and mark a second alternative as correct
    And I save the changes
    Then the question has two correct alternatives

  Scenario: Editing a question does not affect already-generated PDFs
    Given a question has been used in a generated PDF batch
    When I edit the question statement
    Then the previously generated PDF is unchanged

  # --- Delete ---

  Scenario: Delete a question not used in any exam
    Given a question exists that is not assigned to any exam
    When I delete the question
    Then the question is removed from the question list

  Scenario: Fail to delete a question used in an exam
    Given a question exists that is assigned to at least one exam
    When I attempt to delete the question
    Then I see an error "Question cannot be deleted because it is used in one or more exams"
    And the question remains in the list

  # --- List ---

  Scenario: List questions with pagination
    Given 25 questions exist in the system
    When I navigate to the question list page
    Then I see the first page of questions
    And pagination controls are displayed

  Scenario: Search questions by statement text
    Given questions exist with statements "Photosynthesis process" and "Newton's laws"
    When I navigate to the question list page
    And I search for "Newton"
    Then only "Newton's laws" appears in the results

  Scenario: Search returns no results for an unmatched term
    Given questions exist in the system
    When I navigate to the question list page
    And I search for "xyznonexistent"
    Then the question list is empty
    And an empty question list message is displayed
