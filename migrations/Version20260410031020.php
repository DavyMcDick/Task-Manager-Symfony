<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260410031020 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Adds task positions to support persistent drag and drop ordering.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE task ADD COLUMN position INTEGER NOT NULL DEFAULT 0');
        $this->addSql('UPDATE task SET position = id WHERE position = 0');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TEMPORARY TABLE __temp__task AS SELECT id, title, description, status, created_at FROM task');
        $this->addSql('DROP TABLE task');
        $this->addSql('CREATE TABLE task (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, title VARCHAR(255) NOT NULL, description CLOB DEFAULT NULL, status VARCHAR(20) NOT NULL, created_at DATETIME NOT NULL)');
        $this->addSql('INSERT INTO task (id, title, description, status, created_at) SELECT id, title, description, status, created_at FROM __temp__task');
        $this->addSql('DROP TABLE __temp__task');
    }
}
