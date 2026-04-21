<?php

namespace App\Form;

use App\Entity\Task;
use App\Enum\TaskStatus;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\DateType;
use Symfony\Component\Form\Extension\Core\Type\EnumType;
use Symfony\Component\Form\Extension\Core\Type\TextareaType;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;

class TaskType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder
            ->add('title', TextType::class, [
                'label' => 'Title',
                'attr' => [
                    'placeholder' => 'Prepare sprint review slides',
                    'class' => 'mt-1.5 block w-full rounded-2xl border-0 bg-slate-100 px-4 py-2.5 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500',
                ],
            ])
            ->add('description', TextareaType::class, [
                'label' => 'Description',
                'required' => false,
                'attr' => [
                    'rows' => 3,
                    'placeholder' => 'Add more context for the task if needed.',
                    'class' => 'mt-1.5 block w-full rounded-2xl border-0 bg-slate-100 px-4 py-2.5 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500',
                ],
            ])
            ->add('status', EnumType::class, [
                'class' => TaskStatus::class,
                'label' => 'Status',
                'choice_label' => static fn(TaskStatus $status) => $status->getLabel(),
                'attr' => [
                    'class' => 'mt-1.5 block w-full rounded-2xl border-0 bg-slate-100 px-4 py-2.5 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-cyan-500',
                ],
            ])
            ->add('dueDate', DateType::class, [
                'label' => 'Due date',
                'required' => false,
                'widget' => 'single_text',
                'html5' => true,
                'attr' => [
                    'class' => 'mt-1.5 block w-full rounded-2xl border-0 bg-slate-100 px-4 py-2.5 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-cyan-500',
                ],
            ]);
    }

    public function configureOptions(OptionsResolver $resolver): void
    {
        $resolver->setDefaults([
            'data_class' => Task::class,
        ]);
    }
}
