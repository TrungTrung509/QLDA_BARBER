# Crewly Project Directory

This directory contains Crewly-specific files for **Barbershop-Booking-System** project orchestration.

## Structure

- **specs/**: Project specifications and requirements
- **tickets/**: The project backlog, one markdown file per ticket (commit it with the project)
- **memory/**: Agent memory and context files
- **prompts/**: Custom system prompts for team members

## Usage

Crewly agents automatically read from these directories to understand:
- Project requirements and specifications
- Current tasks and their status
- Historical context and decisions
- Role-specific instructions

All files in this directory are monitored by Crewly for real-time updates.

## Getting Started

1. Update `specs/project.md` with your project requirements
2. Add tickets from the dashboard (project, Tasks tab) or ask the orchestrator to put work in the backlog
3. Customize team member prompts in `prompts/` as needed
4. Let Crewly orchestrate your development workflow!
