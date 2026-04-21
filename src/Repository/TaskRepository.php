<?php

namespace App\Repository;

use App\Entity\Task;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Task>
 */
class TaskRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Task::class);
    }

    /**
     * @return list<Task>
     */
    public function findAllOrderedByNewest(): array
    {
        return $this->createQueryBuilder('task')
            ->orderBy('task.position', 'ASC')
            ->addOrderBy('task.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * @return list<Task>
     */
    public function findDashboardSlice(int $limit = 120, int $offset = 0): array
    {
        return $this->createQueryBuilder('task')
            ->select('partial task.{id, title, description, status, dueDate, createdAt, position}')
            ->orderBy('task.position', 'ASC')
            ->addOrderBy('task.createdAt', 'DESC')
            ->setMaxResults($limit)
            ->setFirstResult($offset)
            ->getQuery()
            ->getResult();
    }

    public function countAllTasks(): int
    {
        return (int) $this->createQueryBuilder('task')
            ->select('COUNT(task.id)')
            ->getQuery()
            ->getSingleScalarResult();
    }
}
