Feature: Class Management
  As an instructor
  I want to manage classes
  So that I can organise students and their evaluations by course offering

  Background:
    Given I am on the "Turmas" page

  # ---------------------------------------------------------------------------
  # Listing
  # ---------------------------------------------------------------------------

  Scenario: View empty class list
    Given no classes are registered
    Then I should see an empty state message
    And I should see a "Nova Turma" button

  Scenario: View registered classes
    Given the following classes are registered:
      | Description                   | Year | Semester |
      | Introdução à Programação       | 2026 | 1        |
      | Estruturas de Dados            | 2026 | 1        |
    Then I should see 2 classes in the list
    And the list should include "Introdução à Programação"
    And the list should include "Estruturas de Dados"

  # ---------------------------------------------------------------------------
  # Creation
  # ---------------------------------------------------------------------------

  Scenario: Create a class successfully
    When I click "Nova Turma"
    And I fill in "Descrição" with "Algoritmos Avançados"
    And I fill in "Ano" with "2026"
    And I select "2" for "Semestre"
    And I click "Salvar"
    Then I should see "Algoritmos Avançados" in the class list
    And I should see a success notification

  Scenario Outline: Cannot create a class with a missing required field
    When I click "Nova Turma"
    And I fill in "Descrição" with "<descricao>"
    And I fill in "Ano" with "<ano>"
    And I select "<semestre>" for "Semestre"
    And I click "Salvar"
    Then I should see a validation error for "<campo>"
    And the modal should remain open

    Examples:
      | descricao              | ano  | semestre | campo    |
      |                        | 2026 | 1        | Descrição |
      | Algoritmos Avançados   |      | 1        | Ano       |
      | Algoritmos Avançados   | 2026 |          | Semestre  |

  Scenario: Dismiss the creation modal without saving
    When I click "Nova Turma"
    And I fill in "Descrição" with "Algoritmos Avançados"
    And I click "Cancelar"
    Then the modal should be closed
    And no new class should appear in the list

  # ---------------------------------------------------------------------------
  # Editing
  # ---------------------------------------------------------------------------

  Scenario: Edit a class successfully
    Given a class "Introdução à Programação" in year 2026, semester 1 is registered
    When I click the edit button for "Introdução à Programação"
    And I change "Ano" to "2027"
    And I click "Salvar"
    Then the class should show year "2027" in the list
    And I should see a success notification

  Scenario: Edit form is pre-filled with current class data
    Given a class "Introdução à Programação" in year 2026, semester 1 is registered
    When I click the edit button for "Introdução à Programação"
    Then the "Descrição" field should contain "Introdução à Programação"
    And the "Ano" field should contain "2026"
    And the "Semestre" field should have "1" selected

  # ---------------------------------------------------------------------------
  # Deletion
  # ---------------------------------------------------------------------------

  Scenario: Delete a class successfully
    Given a class "Introdução à Programação" is registered
    When I click the delete button for "Introdução à Programação"
    And I confirm the deletion
    Then "Introdução à Programação" should no longer appear in the class list
    And I should see a success notification

  Scenario: Cancel deletion of a class
    Given a class "Introdução à Programação" is registered
    When I click the delete button for "Introdução à Programação"
    And I cancel the deletion
    Then "Introdução à Programação" should still appear in the class list

  # ---------------------------------------------------------------------------
  # Class detail view
  # ---------------------------------------------------------------------------

  Scenario: Navigate to class detail page
    Given a class "Introdução à Programação" is registered
    When I click on "Introdução à Programação"
    Then I should be on the detail page for "Introdução à Programação"
    And I should see the class description, year, and semester

  Scenario: Class detail page shows enrolled students
    Given a class "Introdução à Programação" is registered
    And the following students are enrolled in "Introdução à Programação":
      | Name       |
      | Ana Lima   |
      | João Silva |
    When I navigate to the detail page for "Introdução à Programação"
    Then I should see "Ana Lima" in the enrolled students list
    And I should see "João Silva" in the enrolled students list

  Scenario: Class detail page shows the evaluation table
    Given a class "Introdução à Programação" is registered
    And the goals "Requisitos" and "Testes" exist
    And "Ana Lima" is enrolled in "Introdução à Programação"
    When I navigate to the detail page for "Introdução à Programação"
    Then I should see an evaluation table with "Ana Lima" as a row
    And the table should have "Requisitos" and "Testes" as columns

  # ---------------------------------------------------------------------------
  # Student enrollment
  # ---------------------------------------------------------------------------

  Scenario: Enroll a student in a class
    Given a class "Introdução à Programação" is registered
    And a student "Ana Lima" is registered but not enrolled in "Introdução à Programação"
    When I navigate to the detail page for "Introdução à Programação"
    And I click "Matricular Aluno"
    And I select "Ana Lima" from the student list
    And I click "Confirmar"
    Then "Ana Lima" should appear in the enrolled students list
    And I should see a success notification

  Scenario: Already-enrolled students do not appear in the enrollment selector
    Given a class "Introdução à Programação" is registered
    And "Ana Lima" is already enrolled in "Introdução à Programação"
    And "João Silva" is not enrolled in "Introdução à Programação"
    When I navigate to the detail page for "Introdução à Programação"
    And I click "Matricular Aluno"
    Then "Ana Lima" should not appear in the student selector
    And "João Silva" should appear in the student selector

  Scenario: Unenroll a student from a class
    Given "Ana Lima" is enrolled in "Introdução à Programação"
    When I navigate to the detail page for "Introdução à Programação"
    And I click the unenroll button for "Ana Lima"
    And I confirm the removal
    Then "Ana Lima" should no longer appear in the enrolled students list
    And I should see a success notification

  Scenario: Cancel unenrollment of a student
    Given "Ana Lima" is enrolled in "Introdução à Programação"
    When I navigate to the detail page for "Introdução à Programação"
    And I click the unenroll button for "Ana Lima"
    And I cancel the removal
    Then "Ana Lima" should still appear in the enrolled students list
