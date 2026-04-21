<?php

namespace App\Enum;

enum TaskStatus: string
{
    case PENDING = 'pending';
    case IN_PROGRESS = 'in_progress';
    case DONE = 'done';

    public function getLabel(): string
    {
        return match ($this) {
            self::PENDING => 'Pending',
            self::IN_PROGRESS => 'In Progress',
            self::DONE => 'Completed',
        };
    }

    public function getBadgeClasses(): string
    {
        return match ($this) {
            self::PENDING => 'bg-slate-200 text-slate-700 ring-slate-300',
            self::IN_PROGRESS => 'bg-amber-100 text-amber-800 ring-amber-300',
            self::DONE => 'bg-emerald-100 text-emerald-800 ring-emerald-300',
        };
    }

    public function getButtonClasses(): string
    {
        return match ($this) {
            self::PENDING => 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200',
            self::IN_PROGRESS => 'border-amber-300 bg-amber-100 text-amber-800 hover:bg-amber-200',
            self::DONE => 'border-emerald-300 bg-emerald-100 text-emerald-800 hover:bg-emerald-200',
        };
    }

    public function getHelpText(): string
    {
        return match ($this) {
            self::PENDING => 'Task is still waiting to be started.',
            self::IN_PROGRESS => 'Task is currently being worked on.',
            self::DONE => 'Task has been finished.',
        };
    }
}
