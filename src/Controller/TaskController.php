<?php

namespace App\Controller;

use App\Entity\Task;
use App\Enum\TaskStatus;
use App\Form\TaskType;
use App\Repository\TaskRepository;
use DateTimeImmutable;
use DateTimeZone;
use Doctrine\ORM\EntityManagerInterface;
use JsonException;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Csrf\CsrfTokenManagerInterface;

#[Route('/')]
final class TaskController extends AbstractController
{
    #[Route('', name: 'task_index', methods: ['GET'])]
    public function index(Request $request, TaskRepository $taskRepository): Response
    {
        $page = max(1, $request->query->getInt('page', 1));
        $limit = min(160, max(30, $request->query->getInt('limit', 80)));
        $offset = ($page - 1) * $limit;

        $tasks = $taskRepository->findDashboardSlice($limit, $offset);
        $totalTasks = $taskRepository->countAllTasks();
        $statuses = TaskStatus::cases();
        $boardTasks = [];

        foreach ($statuses as $status) {
            $boardTasks[$status->value] = array_values(array_filter(
                $tasks,
                static fn(Task $task): bool => $task->getStatus() === $status
            ));
        }

        $response = $this->render('task/index.html.twig', [
            'tasks' => $tasks,
            'statuses' => $statuses,
            'boardTasks' => $boardTasks,
            'loadMeta' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $totalTasks,
                'visible' => count($tasks),
                'hasMore' => ($offset + count($tasks)) < $totalTasks,
            ],
        ]);

        $response->setPublic();
        $response->setMaxAge(120);
        $response->setSharedMaxAge(300);
        $response->headers->set('Vary', 'Accept-Encoding');

        return $response;
    }

    #[Route('/tasks/new', name: 'task_new', methods: ['GET', 'POST'])]
    public function new(Request $request, EntityManagerInterface $entityManager): Response
    {
        $task = new Task();
        $nextPosition = (int) $entityManager->createQueryBuilder()
            ->select('COALESCE(MAX(task.position), 0)')
            ->from(Task::class, 'task')
            ->getQuery()
            ->getSingleScalarResult();
        $task->setPosition($nextPosition + 1);
        $form = $this->createForm(TaskType::class, $task);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $entityManager->persist($task);
            $entityManager->flush();

            $this->addFlash('task_created', 'Task created successfully.');

            return $this->redirectToRoute('task_index');
        }

        return $this->render('task/new.html.twig', [
            'form' => $form,
        ]);
    }

    #[Route('/tasks/{id}/edit', name: 'task_edit', requirements: ['id' => '\d+'], methods: ['GET', 'POST'])]
    public function edit(Task $task, Request $request, EntityManagerInterface $entityManager): Response
    {
        $form = $this->createForm(TaskType::class, $task);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $entityManager->flush();

            $this->addFlash('task_updated', 'Task updated successfully.');

            return $this->redirectToRoute('task_index');
        }

        return $this->render('task/edit.html.twig', [
            'task' => $task,
            'form' => $form,
        ]);
    }

    #[Route('/tasks/ajax-create', name: 'task_create_ajax', methods: ['POST'])]
    public function createAjax(Request $request, EntityManagerInterface $entityManager, CsrfTokenManagerInterface $csrfTokenManager): JsonResponse
    {
        if (!$request->isXmlHttpRequest()) {
            return $this->json(['message' => 'Invalid request type.'], Response::HTTP_BAD_REQUEST);
        }

        $token = (string) $request->request->get('_token');

        if (!$this->isCsrfTokenValid('task-create', $token)) {
            return $this->json(['message' => 'Unable to create the task.'], Response::HTTP_FORBIDDEN);
        }

        $title = trim((string) $request->request->get('title'));
        $description = trim((string) $request->request->get('description'));
        $status = TaskStatus::tryFrom((string) $request->request->get('status'));
        $dueDate = $this->parseDueDate((string) $request->request->get('dueDate'));

        if ($title === '') {
            return $this->json([
                'message' => 'Please enter a task title.',
                'errors' => ['title' => 'Please enter a task title.'],
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        if (mb_strlen($title) > 255) {
            return $this->json([
                'message' => 'The title cannot be longer than 255 characters.',
                'errors' => ['title' => 'The title cannot be longer than 255 characters.'],
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        if (mb_strlen($description) > 2000) {
            return $this->json([
                'message' => 'The description cannot be longer than 2000 characters.',
                'errors' => ['description' => 'The description cannot be longer than 2000 characters.'],
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        if (!$status instanceof TaskStatus) {
            return $this->json([
                'message' => 'Invalid task status selected.',
                'errors' => ['status' => 'Invalid task status selected.'],
            ], Response::HTTP_BAD_REQUEST);
        }

        if ($dueDate === false) {
            return $this->json([
                'message' => 'Please enter a valid due date.',
                'errors' => ['dueDate' => 'Please enter a valid due date.'],
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $nextPosition = (int) $entityManager->createQueryBuilder()
            ->select('COALESCE(MAX(task.position), 0)')
            ->from(Task::class, 'task')
            ->getQuery()
            ->getSingleScalarResult();

        $task = new Task();
        $task->setTitle($title);
        $task->setDescription($description !== '' ? $description : null);
        $task->setStatus($status);
        $task->setDueDate($dueDate ?: null);
        $task->setPosition($nextPosition + 1);

        $entityManager->persist($task);
        $entityManager->flush();

        return $this->json([
            'message' => 'Task added successfully.',
            'task' => $this->normalizeTask($task),
            'csrf' => [
                'delete' => $csrfTokenManager->getToken('delete-task-' . $task->getId())->getValue(),
                'updateStatus' => $csrfTokenManager->getToken('update-status-' . $task->getId())->getValue(),
                'edit' => $csrfTokenManager->getToken('task-edit-' . $task->getId())->getValue(),
            ],
        ], Response::HTTP_CREATED);
    }

    #[Route('/tasks/{id}/ajax-update', name: 'task_update_ajax', requirements: ['id' => '\d+'], methods: ['POST'])]
    public function updateAjax(Task $task, Request $request, EntityManagerInterface $entityManager): JsonResponse
    {
        if (!$request->isXmlHttpRequest()) {
            return $this->json(['message' => 'Invalid request type.'], Response::HTTP_BAD_REQUEST);
        }

        $token = (string) $request->request->get('_token');

        if (!$this->isCsrfTokenValid('task-edit-' . $task->getId(), $token)) {
            return $this->json(['message' => 'Unable to update the task.'], Response::HTTP_FORBIDDEN);
        }

        $title = trim((string) $request->request->get('title'));
        $description = trim((string) $request->request->get('description'));
        $status = TaskStatus::tryFrom((string) $request->request->get('status'));
        $dueDate = $this->parseDueDate((string) $request->request->get('dueDate'));

        if ($title === '') {
            return $this->json([
                'message' => 'Please enter a task title.',
                'errors' => ['title' => 'Please enter a task title.'],
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        if (mb_strlen($title) > 255) {
            return $this->json([
                'message' => 'The title cannot be longer than 255 characters.',
                'errors' => ['title' => 'The title cannot be longer than 255 characters.'],
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        if (mb_strlen($description) > 2000) {
            return $this->json([
                'message' => 'The description cannot be longer than 2000 characters.',
                'errors' => ['description' => 'The description cannot be longer than 2000 characters.'],
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        if (!$status instanceof TaskStatus) {
            return $this->json([
                'message' => 'Invalid task status selected.',
                'errors' => ['status' => 'Invalid task status selected.'],
            ], Response::HTTP_BAD_REQUEST);
        }

        if ($dueDate === false) {
            return $this->json([
                'message' => 'Please enter a valid due date.',
                'errors' => ['dueDate' => 'Please enter a valid due date.'],
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $task->setTitle($title);
        $task->setDescription($description !== '' ? $description : null);
        $task->setStatus($status);
        $task->setDueDate($dueDate ?: null);

        $entityManager->flush();

        return $this->json([
            'message' => 'Task updated successfully.',
            'task' => $this->normalizeTask($task),
        ]);
    }

    #[Route('/tasks/{id}', name: 'task_delete', requirements: ['id' => '\d+'], methods: ['POST'])]
    public function delete(Task $task, Request $request, EntityManagerInterface $entityManager): Response
    {
        $token = (string) $request->request->get('_token');

        if (!$this->isCsrfTokenValid('delete-task-' . $task->getId(), $token)) {
            if ($request->isXmlHttpRequest()) {
                return $this->json(['message' => 'Unable to delete the task.'], Response::HTTP_FORBIDDEN);
            }

            $this->addFlash('error', 'Unable to delete the task.');

            return $this->redirectToRoute('task_index');
        }

        $taskId = $task->getId();

        $entityManager->remove($task);
        $entityManager->flush();

        if ($request->isXmlHttpRequest()) {
            return $this->json([
                'id' => $taskId,
                'message' => 'Task deleted successfully.',
            ]);
        }

        $this->addFlash('task_deleted', 'Task deleted successfully.');

        return $this->redirectToRoute('task_index');
    }

    #[Route('/tasks/{id}/status', name: 'task_update_status', requirements: ['id' => '\d+'], methods: ['POST'])]
    public function updateStatus(Task $task, Request $request, EntityManagerInterface $entityManager): Response
    {
        $token = (string) $request->request->get('_token');

        if (!$this->isCsrfTokenValid('update-status-' . $task->getId(), $token)) {
            if ($request->isXmlHttpRequest()) {
                return $this->json(['message' => 'Unable to update the task status.'], Response::HTTP_FORBIDDEN);
            }

            $this->addFlash('error', 'Unable to update the task status.');

            return $this->redirectToRoute('task_index');
        }

        $status = TaskStatus::tryFrom((string) $request->request->get('status'));

        if (!$status instanceof TaskStatus) {
            if ($request->isXmlHttpRequest()) {
                return $this->json(['message' => 'Invalid task status selected.'], Response::HTTP_BAD_REQUEST);
            }

            $this->addFlash('error', 'Invalid task status selected.');

            return $this->redirectToRoute('task_index');
        }

        $task->setStatus($status);
        $entityManager->flush();

        if ($request->isXmlHttpRequest()) {
            return $this->json([
                'message' => sprintf('Task moved to %s.', $status->getLabel()),
                'status' => [
                    'value' => $status->value,
                    'label' => $status->getLabel(),
                    'badgeClasses' => $status->getBadgeClasses(),
                    'buttonClasses' => $status->getButtonClasses(),
                    'helpText' => $status->getHelpText(),
                ],
            ]);
        }

        $this->addFlash('task_updated', sprintf('Task moved to %s.', $status->getLabel()));

        return $this->redirectToRoute('task_index');
    }

    #[Route('/tasks/reorder', name: 'task_reorder', methods: ['POST'])]
    public function reorder(Request $request, TaskRepository $taskRepository, EntityManagerInterface $entityManager): JsonResponse
    {
        try {
            $payload = json_decode($request->getContent(), true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            return $this->json(['message' => 'Invalid request body.'], Response::HTTP_BAD_REQUEST);
        }

        $taskIds = $payload['taskIds'] ?? null;

        if (!is_array($taskIds) || $taskIds === []) {
            return $this->json(['message' => 'No tasks were provided.'], Response::HTTP_BAD_REQUEST);
        }

        $tasks = $taskRepository->findBy(['id' => $taskIds]);
        $tasksById = [];

        foreach ($tasks as $task) {
            $tasksById[$task->getId()] = $task;
        }

        foreach ($taskIds as $index => $taskId) {
            if (!is_int($taskId) && !ctype_digit((string) $taskId)) {
                return $this->json(['message' => 'Invalid task identifier received.'], Response::HTTP_BAD_REQUEST);
            }

            $taskId = (int) $taskId;

            if (!isset($tasksById[$taskId])) {
                return $this->json(['message' => 'One or more tasks could not be found.'], Response::HTTP_NOT_FOUND);
            }

            $tasksById[$taskId]->setPosition($index + 1);
        }

        $entityManager->flush();

        return $this->json(['message' => 'Task order updated.']);
    }

    private function parseDueDate(string $dateValue): DateTimeImmutable|false|null
    {
        if (trim($dateValue) === '') {
            return null;
        }

        $dueDate = DateTimeImmutable::createFromFormat('!Y-m-d', $dateValue, new DateTimeZone('Asia/Manila'));

        if (!$dueDate instanceof DateTimeImmutable) {
            return false;
        }

        return $dueDate;
    }

    private function normalizeTask(Task $task): array
    {
        $status = $task->getStatus();
        $displayTimezone = new DateTimeZone('Asia/Manila');
        $createdAt = $task->getCreatedAt()->setTimezone($displayTimezone);

        return [
            'id' => $task->getId(),
            'title' => $task->getTitle(),
            'description' => $task->getDescription() ?? '',
            'descriptionFallback' => $task->getDescription() ?: 'No description provided.',
            'status' => [
                'value' => $status->value,
                'label' => $status->getLabel(),
                'badgeClasses' => $status->getBadgeClasses(),
                'helpText' => $status->getHelpText(),
            ],
            'createdAt' => [
                'iso' => $createdAt->format(DATE_ATOM),
                'display' => $createdAt->format('M d, Y - H:i'),
            ],
            'dueDate' => [
                'value' => $task->getDueDate()?->format('Y-m-d') ?? '',
                'label' => $task->getDueDate()?->format('M d, Y') ?? 'No due date',
            ],
        ];
    }
}
