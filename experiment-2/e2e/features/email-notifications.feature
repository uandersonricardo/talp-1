Feature: Email Notifications
  As a student
  I want to receive an email when my instructor updates my evaluations
  So that I am always informed of my progress without checking the system constantly

  Background:
    Given the goal "Requisitos" and "Testes" exist
    And a class "Introdução à Programação" is registered
    And a student "Ana Lima" with email "ana@example.com" is registered
    And "Ana Lima" is enrolled in "Introdução à Programação"

  # ---------------------------------------------------------------------------
  # Queuing on grade entry
  # ---------------------------------------------------------------------------

  Scenario: An email is queued when a grade is recorded for the first time
    When the instructor records the grade "MA" for "Ana Lima" on "Requisitos" in "Introdução à Programação"
    Then an email notification should be queued for "ana@example.com"

  Scenario: An email is queued when an existing grade is updated
    Given "Ana Lima" has the grade "MANA" for "Requisitos" in "Introdução à Programação"
    When the instructor updates the grade to "MPA"
    Then an email notification should be queued for "ana@example.com"

  Scenario: No email is queued when the recorded grade is the same as the current one
    Given "Ana Lima" has the grade "MA" for "Requisitos" in "Introdução à Programação"
    When the instructor records the grade "MA" again for "Requisitos"
    Then no new email notification should be queued for "ana@example.com"

  # ---------------------------------------------------------------------------
  # One email per student per day
  # ---------------------------------------------------------------------------

  Scenario: Multiple grade updates on the same day result in only one queued email
    When the instructor records the grade "MA" for "Ana Lima" on "Requisitos" in "Introdução à Programação"
    And the instructor records the grade "MPA" for "Ana Lima" on "Testes" in "Introdução à Programação"
    Then exactly one pending email notification should exist for "ana@example.com" today

  Scenario: The single daily email includes all grade updates made that day
    When the instructor records the grade "MA" for "Ana Lima" on "Requisitos" in "Introdução à Programação"
    And the instructor records the grade "MPA" for "Ana Lima" on "Testes" in "Introdução à Programação"
    And the daily digest job runs
    Then "ana@example.com" should receive exactly 1 email
    And the email should mention the grade "MA" for "Requisitos"
    And the email should mention the grade "MPA" for "Testes"

  Scenario: Updates to the same goal on the same day appear only once in the email with the latest grade
    When the instructor records the grade "MANA" for "Ana Lima" on "Requisitos" in "Introdução à Programação"
    And the instructor updates the grade to "MA" for "Ana Lima" on "Requisitos" in "Introdução à Programação"
    And the daily digest job runs
    Then "ana@example.com" should receive exactly 1 email
    And the email should mention the grade "MA" for "Requisitos"
    And the email should not mention the grade "MANA" for "Requisitos"

  # ---------------------------------------------------------------------------
  # Cross-class consolidation
  # ---------------------------------------------------------------------------

  Scenario: Updates from multiple classes are consolidated into one daily email
    Given a class "Estruturas de Dados" is registered
    And "Ana Lima" is enrolled in "Estruturas de Dados"
    When the instructor records the grade "MA" for "Ana Lima" on "Requisitos" in "Introdução à Programação"
    And the instructor records the grade "MPA" for "Ana Lima" on "Testes" in "Estruturas de Dados"
    And the daily digest job runs
    Then "ana@example.com" should receive exactly 1 email
    And the email should reference "Introdução à Programação"
    And the email should reference "Estruturas de Dados"

  # ---------------------------------------------------------------------------
  # One email per student (not per class or goal)
  # ---------------------------------------------------------------------------

  Scenario: Different students each receive their own email
    Given a student "João Silva" with email "joao@example.com" is registered
    And "João Silva" is enrolled in "Introdução à Programação"
    When the instructor records the grade "MA" for "Ana Lima" on "Requisitos" in "Introdução à Programação"
    And the instructor records the grade "MANA" for "João Silva" on "Requisitos" in "Introdução à Programação"
    And the daily digest job runs
    Then "ana@example.com" should receive exactly 1 email
    And "joao@example.com" should receive exactly 1 email
    And the email to "joao@example.com" should not mention "Ana Lima"

  # ---------------------------------------------------------------------------
  # No duplicate sends
  # ---------------------------------------------------------------------------

  Scenario: The daily digest is not sent twice for the same day
    When the instructor records the grade "MA" for "Ana Lima" on "Requisitos" in "Introdução à Programação"
    And the daily digest job runs
    And the daily digest job runs again on the same day
    Then "ana@example.com" should have received exactly 1 email in total today

  Scenario: A new notification queued after the daily digest is sent is included in the next day's email
    When the instructor records the grade "MA" for "Ana Lima" on "Requisitos" in "Introdução à Programação"
    And the daily digest job runs
    And the instructor records the grade "MPA" for "Ana Lima" on "Testes" in "Introdução à Programação"
    And the daily digest job runs the following day
    Then "ana@example.com" should receive a second email on the following day
    And the second email should mention the grade "MPA" for "Testes"

  # ---------------------------------------------------------------------------
  # Email content
  # ---------------------------------------------------------------------------

  Scenario: Email addresses the student by name
    When the instructor records the grade "MA" for "Ana Lima" on "Requisitos" in "Introdução à Programação"
    And the daily digest job runs
    Then the email sent to "ana@example.com" should address "Ana Lima" by name

  Scenario: Email subject includes the date of the updates
    When the instructor records the grade "MA" for "Ana Lima" on "Requisitos" in "Introdução à Programação"
    And the daily digest job runs
    Then the email subject should contain today's date formatted as "DD/MM/YYYY"

  # ---------------------------------------------------------------------------
  # Graceful degradation when SMTP is not configured
  # ---------------------------------------------------------------------------

  Scenario: Email queue accumulates even when SMTP is not configured
    Given SMTP credentials are not configured
    When the instructor records the grade "MA" for "Ana Lima" on "Requisitos" in "Introdução à Programação"
    Then an email notification should still be queued for "ana@example.com"
    And no error should be shown to the instructor
