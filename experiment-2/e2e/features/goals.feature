Feature: Goal Management
  As an instructor
  I want to manage learning goals
  So that evaluation tables have the correct columns for each skill being assessed

  Background:
    Given I am on the "Metas" page

  # ---------------------------------------------------------------------------
  # Listing
  # ---------------------------------------------------------------------------

  Scenario: View empty goal list
    Given no goals are registered
    Then I should see an empty state message

  Scenario: View registered goals
    Given the following goals are registered:
      | Name        |
      | Requisitos  |
      | Testes      |
      | Arquitetura |
    Then I should see 3 goals in the list
    And the list should include "Requisitos"
    And the list should include "Testes"
    And the list should include "Arquitetura"

  # ---------------------------------------------------------------------------
  # Creation
  # ---------------------------------------------------------------------------

  Scenario: Create a goal successfully
    When I fill in the new goal field with "Documentação"
    And I click "Adicionar"
    Then I should see "Documentação" in the goal list
    And I should see a success notification

  Scenario: Cannot create a goal with an empty name
    When I leave the new goal field blank
    And I click "Adicionar"
    Then I should see a validation error for "Nome"
    And no new goal should appear in the list

  Scenario: Cannot create a goal with a duplicate name
    Given a goal "Requisitos" is already registered
    When I fill in the new goal field with "Requisitos"
    And I click "Adicionar"
    Then I should see an error indicating the goal name is already in use

  # ---------------------------------------------------------------------------
  # Deletion
  # ---------------------------------------------------------------------------

  Scenario: Delete a goal successfully
    Given a goal "Requisitos" is registered
    When I click the delete button for "Requisitos"
    And I confirm the deletion
    Then "Requisitos" should no longer appear in the goal list
    And I should see a success notification

  Scenario: Cancel deletion of a goal
    Given a goal "Requisitos" is registered
    When I click the delete button for "Requisitos"
    And I cancel the deletion
    Then "Requisitos" should still appear in the goal list

  Scenario: Deleting a goal removes its column from all evaluation tables
    Given a goal "Requisitos" is registered
    And "Ana Lima" is enrolled in "Introdução à Programação"
    And "Ana Lima" has a grade for "Requisitos" in "Introdução à Programação"
    When I click the delete button for "Requisitos"
    And I confirm the deletion
    And I navigate to the detail page for "Introdução à Programação"
    Then the evaluation table should not have a "Requisitos" column
