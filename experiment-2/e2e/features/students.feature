Feature: Student Management
  As an instructor
  I want to manage students
  So that I can keep a complete and accurate registry of all students

  Background:
    Given I am on the "Alunos" page

  # ---------------------------------------------------------------------------
  # Listing
  # ---------------------------------------------------------------------------

  Scenario: View empty student list
    Given no students are registered
    Then I should see an empty state message
    And I should see a "Novo Aluno" button

  Scenario: View registered students
    Given the following students are registered:
      | Name       | CPF            | Email             |
      | Ana Lima   | 111.444.777-35 | ana@example.com   |
      | João Silva | 987.654.321-00 | joao@example.com  |
    Then I should see 2 students in the list
    And the list should include "Ana Lima"
    And the list should include "João Silva"

  # ---------------------------------------------------------------------------
  # Creation
  # ---------------------------------------------------------------------------

  Scenario: Create a student successfully
    When I click "Novo Aluno"
    And I fill in "Nome" with "Carlos Souza"
    And I fill in "CPF" with "111.444.777-35"
    And I fill in "E-mail" with "carlos@example.com"
    And I click "Salvar"
    Then I should see "Carlos Souza" in the student list
    And I should see a success notification

  Scenario Outline: Cannot create a student with a missing required field
    When I click "Novo Aluno"
    And I fill in "Nome" with "<nome>"
    And I fill in "CPF" with "<cpf>"
    And I fill in "E-mail" with "<email>"
    And I click "Salvar"
    Then I should see a validation error for "<campo>"
    And the modal should remain open

    Examples:
      | nome         | cpf            | email             | campo  |
      |              | 111.444.777-35 | ana@example.com   | Nome   |
      | Ana Lima     |                | ana@example.com   | CPF    |
      | Ana Lima     | 111.444.777-35 |                   | E-mail |

  Scenario: Cannot create a student with an invalid CPF format
    When I click "Novo Aluno"
    And I fill in "Nome" with "Ana Lima"
    And I fill in "CPF" with "000.000.000-00"
    And I fill in "E-mail" with "ana@example.com"
    And I click "Salvar"
    Then I should see a validation error for "CPF"

  Scenario: Cannot create a student with a duplicate CPF
    Given a student with CPF "111.444.777-35" is already registered
    When I click "Novo Aluno"
    And I fill in "Nome" with "Other Student"
    And I fill in "CPF" with "111.444.777-35"
    And I fill in "E-mail" with "other@example.com"
    And I click "Salvar"
    Then I should see an error indicating the CPF is already in use

  Scenario: Cannot create a student with an invalid email
    When I click "Novo Aluno"
    And I fill in "Nome" with "Ana Lima"
    And I fill in "CPF" with "111.444.777-35"
    And I fill in "E-mail" with "not-an-email"
    And I click "Salvar"
    Then I should see a validation error for "E-mail"

  Scenario: Dismiss the creation modal without saving
    When I click "Novo Aluno"
    And I fill in "Nome" with "Ana Lima"
    And I click "Cancelar"
    Then the modal should be closed
    And no new student should appear in the list

  # ---------------------------------------------------------------------------
  # Editing
  # ---------------------------------------------------------------------------

  Scenario: Edit a student successfully
    Given a student "Ana Lima" with email "ana@example.com" is registered
    When I click the edit button for "Ana Lima"
    And I change "E-mail" to "ana.lima@example.com"
    And I click "Salvar"
    Then I should see "ana.lima@example.com" in the student list
    And I should see a success notification

  Scenario: Edit form is pre-filled with current student data
    Given a student "Ana Lima" with CPF "111.444.777-35" and email "ana@example.com" is registered
    When I click the edit button for "Ana Lima"
    Then the "Nome" field should contain "Ana Lima"
    And the "CPF" field should contain "111.444.777-35"
    And the "E-mail" field should contain "ana@example.com"

  # ---------------------------------------------------------------------------
  # Deletion
  # ---------------------------------------------------------------------------

  Scenario: Delete a student successfully
    Given a student "Ana Lima" is registered
    When I click the delete button for "Ana Lima"
    And I confirm the deletion
    Then "Ana Lima" should no longer appear in the student list
    And I should see a success notification

  Scenario: Cancel deletion of a student
    Given a student "Ana Lima" is registered
    When I click the delete button for "Ana Lima"
    And I cancel the deletion
    Then "Ana Lima" should still appear in the student list
