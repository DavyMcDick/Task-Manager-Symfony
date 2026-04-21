<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260420000100 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Adds nullable due_date column to task table.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE task ADD COLUMN due_date DATE DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('CREATE TEMPORARY TABLE __temp__task AS SELECT id, title, description, status, created_at, position FROM task');
        $this->addSql('DROP TABLE task');
        $this->addSql('CREATE TABLE task (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, title VARCHAR(255) NOT NULL, description CLOB DEFAULT NULL, status VARCHAR(20) NOT NULL, created_at DATETIME NOT NULL, position INTEGER NOT NULL)');
        $this->addSql('INSERT INTO task (id, title, description, status, created_at, position) SELECT id, title, description, status, created_at, position FROM __temp__task');
        $this->addSql('DROP TABLE __temp__task');
    }
}
