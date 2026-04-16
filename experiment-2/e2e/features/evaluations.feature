Feature: Evaluation Management
  As an instructor
  I want to record and update student grades per learning goal
  So that I can track each student's progress across the goals of a class

  Background:
    Given the goals "Requisitos", "Testes", and "Arquitetura" exist
    And a class "Introdução à Programação" is registered
    And the following students are enrolled in "Introdução à Programação":
      | Name       |
      | Ana Lima   |
      | João Silva |
    And I am on the detail page for "Introdução à Programação"

  # ---------------------------------------------------------------------------
  # Table display
  # ---------------------------------------------------------------------------

  Scenario: Evaluation table shows one row per enrolled student
    Then the evaluation table should have a row for "Ana Lima"
    And the evaluation table should have a row for "João Silva"

  Scenario: Evaluation table shows one column per goal
    Then the evaluation table should have a column for "Requisitos"
    And the evaluation table should have a column for "Testes"
    And the evaluation table should have a column for "Arquitetura"

  Scenario: All cells are empty when no grades have been recorded
    Then every cell in the evaluation table should be empty

  Scenario: Student name column is always visible when scrolling horizontally
    Given many goals exist causing the table to overflow horizontally
    When I scroll the evaluation table to the right
    Then the student name column should remain visible

  # ---------------------------------------------------------------------------
  # Recording a grade
  # ---------------------------------------------------------------------------

  Scenario: Record a grade for a student and goal
    When I click the cell for "Ana Lima" and "Requisitos"
    And I select the grade "MA"
    Then the cell for "Ana Lima" and "Requisitos" should display "MA"
    And I should see a success notification

  Scenario Outline: Record each valid grade value
    When I click the cell for "Ana Lima" and "Requisitos"
    And I select the grade "<grade>"
    Then the cell for "Ana Lima" and "Requisitos" should display "<grade>"

    Examples:
      | grade |
      | MA    |
      | MPA   |
      | MANA  |

  Scenario: Recording a grade for one student does not affect other students
    When I click the cell for "Ana Lima" and "Requisitos"
    And I select the grade "MA"
    Then the cell for "João Silva" and "Requisitos" should remain empty

  Scenario: Recording a grade for one goal does not affect other goals
    When I click the cell for "Ana Lima" and "Requisitos"
    And I select the grade "MA"
    Then the cell for "Ana Lima" and "Testes" should remain empty
    And the cell for "Ana Lima" and "Arquitetura" should remain empty

  # ---------------------------------------------------------------------------
  # Updating a grade
  # ---------------------------------------------------------------------------

  Scenario: Update an existing grade
    Given "Ana Lima" has the grade "MANA" for "Requisitos" in "Introdução à Programação"
    When I click the cell for "Ana Lima" and "Requisitos"
    And I select the grade "MPA"
    Then the cell for "Ana Lima" and "Requisitos" should display "MPA"
    And I should see a success notification

  Scenario: Grade selector highlights the currently recorded grade
    Given "Ana Lima" has the grade "MPA" for "Requisitos" in "Introdução à Programação"
    When I click the cell for "Ana Lima" and "Requisitos"
    Then "MPA" should be highlighted as the selected option

  # ---------------------------------------------------------------------------
  # Grade semantics
  # ---------------------------------------------------------------------------

  Scenario: MA grade is visually distinct from MPA and MANA
    Given "Ana Lima" has the grade "MA" for "Requisitos" in "Introdução à Programação"
    And "Ana Lima" has the grade "MPA" for "Testes" in "Introdução à Programação"
    And "Ana Lima" has the grade "MANA" for "Arquitetura" in "Introdução à Programação"
    Then the "MA" cell should have a different visual style than the "MPA" cell
    And the "MA" cell should have a different visual style than the "MANA" cell
    And the "MPA" cell should have a different visual style than the "MANA" cell

  # ---------------------------------------------------------------------------
  # Cross-class isolation
  # ---------------------------------------------------------------------------

  Scenario: Evaluations from one class do not appear in another class
    Given a class "Estruturas de Dados" is registered
    And "Ana Lima" is enrolled in "Estruturas de Dados"
    And "Ana Lima" has the grade "MA" for "Requisitos" in "Introdução à Programação"
    When I navigate to the detail page for "Estruturas de Dados"
    Then the cell for "Ana Lima" and "Requisitos" should be empty
