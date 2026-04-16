Feature: Data Persistence
  As an instructor
  I want all my data to be saved automatically
  So that no information is lost when I reload the page or restart the server

  # ---------------------------------------------------------------------------
  # Students
  # ---------------------------------------------------------------------------

  Scenario: Registered students persist after a page reload
    Given a student "Ana Lima" with CPF "111.444.777-35" and email "ana@example.com" is registered
    When I reload the page
    And I navigate to the "Alunos" page
    Then I should see "Ana Lima" in the student list

  Scenario: Student updates persist after a page reload
    Given a student "Ana Lima" is registered
    And I update her email to "ana.new@example.com"
    When I reload the page
    And I navigate to the "Alunos" page
    Then "Ana Lima" should show the email "ana.new@example.com"

  Scenario: Student deletion persists after a page reload
    Given a student "Ana Lima" is registered
    And I delete "Ana Lima"
    When I reload the page
    And I navigate to the "Alunos" page
    Then "Ana Lima" should not appear in the student list

  # ---------------------------------------------------------------------------
  # Classes
  # ---------------------------------------------------------------------------

  Scenario: Registered classes persist after a page reload
    Given a class "Introdução à Programação" in year 2026, semester 1 is registered
    When I reload the page
    And I navigate to the "Turmas" page
    Then I should see "Introdução à Programação" in the class list

  Scenario: Student enrollment in a class persists after a page reload
    Given "Ana Lima" is enrolled in "Introdução à Programação"
    When I reload the page
    And I navigate to the detail page for "Introdução à Programação"
    Then "Ana Lima" should appear in the enrolled students list

  # ---------------------------------------------------------------------------
  # Evaluations
  # ---------------------------------------------------------------------------

  Scenario: Recorded grades persist after a page reload
    Given "Ana Lima" is enrolled in "Introdução à Programação"
    And the goal "Requisitos" exists
    And I record the grade "MA" for "Ana Lima" and "Requisitos" in "Introdução à Programação"
    When I reload the page
    And I navigate to the detail page for "Introdução à Programação"
    Then the cell for "Ana Lima" and "Requisitos" should display "MA"

  Scenario: Updated grades persist after a page reload
    Given "Ana Lima" has the grade "MANA" for "Requisitos" in "Introdução à Programação"
    And I update the grade to "MPA"
    When I reload the page
    And I navigate to the detail page for "Introdução à Programação"
    Then the cell for "Ana Lima" and "Requisitos" should display "MPA"

  # ---------------------------------------------------------------------------
  # Goals
  # ---------------------------------------------------------------------------

  Scenario: Registered goals persist after a page reload
    Given a goal "Requisitos" is registered
    When I reload the page
    And I navigate to the "Metas" page
    Then I should see "Requisitos" in the goal list
