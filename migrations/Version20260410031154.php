<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260410031154 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Normalizes the task position column after the initial drag and drop migration.';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TEMPORARY TABLE __temp__task AS SELECT id, title, description, status, created_at, position FROM task');
        $this->addSql('DROP TABLE task');
        $this->addSql('CREATE TABLE task (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, title VARCHAR(255) NOT NULL, description CLOB DEFAULT NULL, status VARCHAR(20) NOT NULL, created_at DATETIME NOT NULL, position INTEGER NOT NULL)');
        $this->addSql('INSERT INTO task (id, title, description, status, created_at, position) SELECT id, title, description, status, created_at, position FROM __temp__task');
        $this->addSql('DROP TABLE __temp__task');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TEMPORARY TABLE __temp__task AS SELECT id, title, description, status, created_at, position FROM task');
        $this->addSql('DROP TABLE task');
        $this->addSql('CREATE TABLE task (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, title VARCHAR(255) NOT NULL, description CLOB DEFAULT NULL, status VARCHAR(20) NOT NULL, created_at DATETIME NOT NULL, position INTEGER DEFAULT 0 NOT NULL)');
        $this->addSql('INSERT INTO task (id, title, description, status, created_at, position) SELECT id, title, description, status, created_at, position FROM __temp__task');
        $this->addSql('DROP TABLE __temp__task');
    }
}
