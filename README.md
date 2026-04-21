# Symfony Task Manager

[![Symfony](https://img.shields.io/badge/Symfony-7.x-black?logo=symfony)](#tech-stack)
[![PHP](https://img.shields.io/badge/PHP-8.2+-777BB4?logo=php&logoColor=white)](#prerequisites)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-CDN-06B6D4?logo=tailwindcss&logoColor=white)](#tech-stack)
[![License](https://img.shields.io/badge/License-Proprietary-lightgrey)](#license)

A clean and modern task manager application built with Symfony, Doctrine ORM, Twig, and TailwindCSS.

## Overview

This project provides a focused CRUD workflow for managing tasks, with both list and board-style task organization.

## Tech Stack

- Backend: Symfony 7, PHP 8.2+
- Database: Doctrine ORM + Doctrine Migrations (SQLite by default)
- Frontend: Twig templates, TailwindCSS, Vanilla JavaScript
- Tooling: Composer, Symfony CLI (recommended)

## Features

- Create tasks with title, description, status, and timestamps
- Edit and update task details in a modern UI flow
- Delete tasks with confirmation
- Change task status with quick controls
- List and board-oriented task organization

## Prerequisites

Before running the project, make sure you have:

- PHP 8.2 or newer
- Composer 2.x
- Symfony CLI (recommended for local development)
- SQLite (default local database)

## Setup

1. Install dependencies.

```bash
composer install
```

2. Apply database migrations.

```bash
php bin/console doctrine:migrations:migrate --no-interaction
```

3. Start the development server.

Preferred (Symfony CLI):

```bash
symfony server:start
```

Alternative (PHP built-in server):

```bash
php -S 127.0.0.1:8000 -t public
```

4. Open the application.

```text
http://127.0.0.1:8000
```

## Database

- Default database: SQLite
- Local database file: `var/data_dev.db`
- Initial migration: `migrations/Version20260410015744.php`

## Development Notes

- TailwindCSS is currently loaded from CDN in the base Twig layout.
- Migrations are included and ready to run in a fresh environment.


