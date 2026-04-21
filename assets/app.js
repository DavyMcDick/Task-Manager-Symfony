import "./stimulus_bootstrap.js";
import "./styles/app.css";
import "./controllers/csrf_protection_controller.js";

let cleanupTaskPage = null;
const SORTABLEJS_URL =
    "https://cdn.jsdelivr.net/npm/sortablejs@1.15.6/Sortable.min.js";

const createToastSystem = () => {
    const region = document.querySelector("[data-toast-region]");

    if (!region) {
        return {
            show: () => {},
            destroy: () => {},
        };
    }

    const variantClasses = {
        create: "border-emerald-200/80 bg-emerald-50 text-emerald-900",
        update: "border-sky-200/80 bg-sky-50 text-sky-900",
        delete: "border-rose-200/80 bg-rose-50 text-rose-900",
        error: "border-amber-200/90 bg-amber-50 text-amber-900",
        info: "border-slate-200/80 bg-white text-slate-900",
    };

    const closeButtons = new Map();
    const actionButtons = new Map();
    const timers = new Map();

    const hideToast = (toast) => {
        if (!(toast instanceof HTMLElement)) {
            return;
        }

        toast.classList.remove("toast-enter");
        toast.classList.add("toast-exit");

        const timer = timers.get(toast);

        if (timer) {
            clearTimeout(timer);
            timers.delete(toast);
        }

        const closeHandler = closeButtons.get(toast);

        if (closeHandler) {
            toast
                .querySelector("[data-toast-close]")
                ?.removeEventListener("click", closeHandler);
            closeButtons.delete(toast);
        }

        const actionHandler = actionButtons.get(toast);

        if (actionHandler) {
            toast
                .querySelector("[data-toast-action]")
                ?.removeEventListener("click", actionHandler);
            actionButtons.delete(toast);
        }

        window.setTimeout(() => {
            toast.remove();
        }, 260);
    };

    const show = (message, variant = "info", options = {}) => {
        const toast = document.createElement("article");
        const styleVariant = variantClasses[variant] ? variant : "info";
        const duration = Number.isFinite(options.duration)
            ? options.duration
            : 4200;
        const actionLabel =
            typeof options.actionLabel === "string"
                ? options.actionLabel
                : null;
        const onAction =
            typeof options.onAction === "function" ? options.onAction : null;

        toast.className = `toast-enter pointer-events-auto overflow-hidden rounded-2xl border px-4 py-3 shadow-lg shadow-slate-950/10 backdrop-blur ${variantClasses[styleVariant]}`;
        toast.innerHTML = `
            <div class="flex items-start gap-3">
                <div class="min-w-0 flex-1">
                    <p class="text-sm font-semibold leading-6">${message}</p>
                    ${actionLabel ? '<button type="button" class="mt-2 inline-flex items-center rounded-full border border-current/20 bg-white/70 px-3 py-1 text-xs font-semibold transition hover:bg-white" data-toast-action></button>' : ""}
                </div>
                <button type="button" class="inline-flex h-7 w-7 items-center justify-center rounded-full text-sm transition hover:bg-white/80" data-toast-close aria-label="Dismiss notification">X</button>
            </div>
        `;

        region.appendChild(toast);

        if (actionLabel) {
            const actionButton = toast.querySelector("[data-toast-action]");

            if (actionButton) {
                actionButton.textContent = actionLabel;
            }
        }

        const closeButton = toast.querySelector("[data-toast-close]");

        const closeHandler = () => {
            hideToast(toast);
        };

        closeButton?.addEventListener("click", closeHandler);
        closeButtons.set(toast, closeHandler);

        if (actionLabel && onAction) {
            const actionButton = toast.querySelector("[data-toast-action]");

            if (actionButton) {
                const actionHandler = async () => {
                    await onAction();
                    hideToast(toast);
                };

                actionButton.addEventListener("click", actionHandler);
                actionButtons.set(toast, actionHandler);
            }
        }

        const timer = window.setTimeout(() => {
            hideToast(toast);
        }, duration);

        timers.set(toast, timer);

        return toast;
    };

    const destroy = () => {
        Array.from(region.children).forEach((child) => {
            if (child instanceof HTMLElement) {
                hideToast(child);
            }
        });
    };

    return {
        show,
        destroy,
    };
};

const initializeTaskPage = () => {
    cleanupTaskPage?.();
    cleanupTaskPage = null;

    const taskTable = document.querySelector("[data-task-table]");

    if (!taskTable) {
        return;
    }

    const tbody = taskTable.querySelector("[data-task-table-body]");
    const layoutButtons = Array.from(
        document.querySelectorAll("[data-layout-button]"),
    );
    const layoutPanels = Array.from(
        document.querySelectorAll("[data-layout-panel]"),
    );
    const flashMessages = Array.from(
        document.querySelectorAll("[data-flash-message]"),
    );

    const deleteModal = document.querySelector("[data-delete-modal]");
    const deleteModalBackdrop = document.querySelector(
        "[data-delete-modal-backdrop]",
    );
    const deleteModalPanel = document.querySelector(
        "[data-delete-modal-panel]",
    );
    const deleteModalTask = document.querySelector("[data-delete-modal-task]");
    const deleteModalCancel = document.querySelector(
        "[data-delete-modal-cancel]",
    );
    const deleteModalConfirm = document.querySelector(
        "[data-delete-modal-confirm]",
    );

    const taskModal = document.querySelector("[data-task-modal]");
    const taskModalBackdrop = document.querySelector(
        "[data-task-modal-backdrop]",
    );
    const taskModalPanel = document.querySelector("[data-task-modal-panel]");
    const taskModalForm = document.querySelector("[data-task-modal-form]");
    const taskModalClose = document.querySelector("[data-task-modal-close]");
    const taskModalCancel = document.querySelector("[data-task-modal-cancel]");
    const taskModalTitle = document.querySelector("[data-task-modal-title]");
    const taskModalKicker = document.querySelector("[data-task-modal-kicker]");
    const taskModalMode = document.querySelector("[data-task-modal-mode]");
    const taskModalTaskId = document.querySelector("[data-task-modal-task-id]");
    const taskModalToken = document.querySelector("[data-task-modal-token]");
    const taskModalSubmit = document.querySelector("[data-task-modal-submit]");

    const taskModalInputTitle = document.querySelector(
        "[data-task-modal-input-title]",
    );
    const taskModalInputDescription = document.querySelector(
        "[data-task-modal-input-description]",
    );
    const taskModalInputStatus = document.querySelector(
        "[data-task-modal-input-status]",
    );
    const taskModalInputDueDate = document.querySelector(
        "[data-task-modal-input-due-date]",
    );

    if (
        !tbody ||
        !(taskModalForm instanceof HTMLFormElement) ||
        !(taskModalInputTitle instanceof HTMLInputElement) ||
        !(taskModalInputDescription instanceof HTMLTextAreaElement) ||
        !(taskModalInputStatus instanceof HTMLSelectElement) ||
        !(taskModalInputDueDate instanceof HTMLInputElement)
    ) {
        return;
    }

    const toasts = createToastSystem();

    let draggedRow = null;
    let dragPreview = null;
    let orderBeforeDrag = [];
    let lastSavedOrder = [];
    let undoOrder = null;
    let pendingDeleteForm = null;
    let dragOverRafId = null;
    let latestDragY = null;
    const boardSortables = [];
    let listSortable = null;
    let listDndInitialized = false;
    let boardDndInitialized = false;
    let sortableLoaderPromise = null;

    const parseResponseJson = async (response) => {
        try {
            return await response.json();
        } catch {
            return {};
        }
    };

    const getCurrentOrder = () =>
        Array.from(tbody.querySelectorAll("[data-task-row]"))
            .map((row) => Number.parseInt(row.dataset.taskId ?? "", 10))
            .filter((id) => Number.isInteger(id));

    const ordersMatch = (firstOrder, secondOrder) => {
        if (firstOrder.length !== secondOrder.length) {
            return false;
        }

        return firstOrder.every((id, index) => id === secondOrder[index]);
    };

    const applyOrder = (taskIds) => {
        taskIds.forEach((taskId) => {
            const row = tbody.querySelector(`[data-task-id="${taskId}"]`);

            if (row) {
                tbody.appendChild(row);
            }
        });
    };

    const showToast = (message, variant = "info", options = {}) => {
        toasts.show(message, variant, options);
    };

    const persistOrder = async (taskIds) => {
        const response = await fetch(taskTable.dataset.reorderUrl ?? "", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Requested-With": "XMLHttpRequest",
            },
            body: JSON.stringify({ taskIds }),
        });

        if (!response.ok) {
            throw new Error("Unable to save task order.");
        }

        return response.json();
    };

    const statusOptionsHtml = Array.from(taskModalInputStatus.options)
        .map(
            (option) =>
                `<option value="${option.value}">${option.textContent ?? ""}</option>`,
        )
        .join("");

    const getEditUrl = (taskId) => {
        const template = taskTable.dataset.updateUrlTemplate ?? "";

        return template.replace("/0/", `/${taskId}/`);
    };

    const getTaskContainerById = (taskId) =>
        document.querySelector(
            `[data-task-row][data-task-id="${taskId}"], [data-task-card][data-task-id="${taskId}"]`,
        );

    const getTaskDataFromContainer = (container) => {
        if (!(container instanceof HTMLElement)) {
            return null;
        }

        return {
            id: container.dataset.taskId ?? "",
            title: container.dataset.taskTitle ?? "",
            description: container.dataset.taskDescription ?? "",
            status: container.dataset.taskStatus ?? "pending",
            dueDate: container.dataset.taskDueDate ?? "",
        };
    };

    const setTaskDataset = (element, task) => {
        if (!(element instanceof HTMLElement)) {
            return;
        }

        element.dataset.taskTitle = task.title;
        element.dataset.taskDescription = task.description;
        element.dataset.taskStatus = task.status.value;
        element.dataset.taskDueDate = task.dueDate.value;
    };

    const updateTaskDataInDom = (task) => {
        const row = document.querySelector(
            `[data-task-row][data-task-id="${task.id}"]`,
        );
        const card = document.querySelector(
            `[data-task-card][data-task-id="${task.id}"]`,
        );

        if (row instanceof HTMLElement) {
            setTaskDataset(row, task);
            row.querySelector("td:nth-child(2) div").textContent = task.title;
            row.querySelector("td:nth-child(3) div").textContent =
                task.descriptionFallback;
            row.querySelector("[data-status-badge]").textContent =
                task.status.label;
            row.querySelector("[data-status-badge]").className =
                `inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] ring-1 ring-inset ${task.status.badgeClasses}`;
            row.querySelector("[data-status-help]").textContent =
                task.status.helpText;

            const select = row.querySelector("[data-status-select]");
            if (select instanceof HTMLSelectElement) {
                select.value = task.status.value;
                select.dataset.previousValue = task.status.value;
            }
        }

        if (card instanceof HTMLElement) {
            setTaskDataset(card, task);
            card.querySelector(".min-w-0 p").textContent = task.title;
            card.querySelector(".min-w-0 p + p").textContent =
                task.descriptionFallback;
            card.querySelector("[data-status-badge]").textContent =
                task.status.label;
            card.querySelector("[data-status-badge]").className =
                `inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] ring-1 ring-inset ${task.status.badgeClasses}`;
            card.querySelector("[data-status-help]").textContent =
                task.status.helpText;

            const select = card.querySelector("[data-status-select]");
            if (select instanceof HTMLSelectElement) {
                select.value = task.status.value;
                select.dataset.previousValue = task.status.value;
            }
        }
    };

    const refreshListEmptyState = () => {
        const rows = tbody.querySelectorAll("[data-task-row]");
        const emptyRow = tbody.querySelector("[data-list-empty-row]");

        if (rows.length === 0 && !emptyRow) {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td colspan="6" class="px-6 py-12 text-center" data-list-empty-row>
                    <div class="mx-auto max-w-md">
                        <p class="text-lg font-semibold text-slate-900">No tasks yet</p>
                        <p class="mt-2 text-sm leading-6 text-slate-600">Create your first task to start tracking work, progress, and completed items.</p>
                        <button type="button" class="mt-6 inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700" data-open-create-modal>
                            Create First Task
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        }

        if (rows.length > 0 && emptyRow) {
            emptyRow.remove();
        }
    };

    const refreshBoardColumns = () => {
        document.querySelectorAll("[data-board-column]").forEach((column) => {
            const cards = column.querySelectorAll("[data-task-card]");
            const count =
                column.parentElement?.querySelector("[data-board-count]");
            const emptyState = column.querySelector("[data-board-empty]");

            if (count) {
                count.textContent = `${cards.length}`;
            }

            if (cards.length === 0 && !emptyState) {
                const placeholder = document.createElement("div");
                placeholder.className =
                    "rounded-[1.3rem] border border-dashed border-slate-300 bg-white/70 px-4 py-6 text-center";
                placeholder.setAttribute("data-board-empty", "");
                placeholder.innerHTML =
                    '<p class="text-sm font-semibold text-slate-700">No tasks here</p><p class="mt-1 text-xs text-slate-500">Move a task here to fill this column.</p>';
                column.appendChild(placeholder);
            }

            if (cards.length > 0 && emptyState) {
                emptyState.remove();
            }
        });
    };

    const activateLayout = (layout) => {
        layoutPanels.forEach((panel) => {
            const isVisible = panel.dataset.layoutPanel === layout;
            panel.classList.toggle("hidden", !isVisible);
        });

        layoutButtons.forEach((button) => {
            const isActive = button.dataset.layoutTarget === layout;

            button.classList.toggle("border-slate-200", isActive);
            button.classList.toggle("bg-white", isActive);
            button.classList.toggle("text-slate-900", isActive);
            button.classList.toggle("border-transparent", !isActive);
            button.classList.toggle("bg-transparent", !isActive);
            button.classList.toggle("text-slate-500", !isActive);
            button.classList.toggle("shadow-sm", isActive);
        });

        window.localStorage.setItem("task-layout-view", layout);

        if (layout === "board") {
            void ensureBoardDndReady();
        }
    };

    const ensureSortableLoaded = async () => {
        if (typeof window.Sortable !== "undefined") {
            return;
        }

        if (sortableLoaderPromise) {
            await sortableLoaderPromise;
            return;
        }

        sortableLoaderPromise = new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = SORTABLEJS_URL;
            script.defer = true;
            script.onload = () => resolve();
            script.onerror = () =>
                reject(new Error("Failed to load SortableJS."));
            document.head.appendChild(script);
        });

        await sortableLoaderPromise;
    };

    const initializeListDnd = () => {
        if (listDndInitialized || typeof window.Sortable === "undefined") {
            return;
        }

        listDndInitialized = true;

        listSortable = new window.Sortable(tbody, {
            animation: 170,
            draggable: "[data-task-row]",
            handle: "[data-list-drag-handle]",
            ghostClass: "task-row-ghost",
            chosenClass: "task-row-chosen",
            dragClass: "task-row-dragging",
            forceFallback: false,
            onStart: () => {
                orderBeforeDrag = getCurrentOrder();
            },
            onEnd: async (event) => {
                if (event.oldIndex === event.newIndex) {
                    return;
                }

                const currentOrder = getCurrentOrder();

                if (ordersMatch(orderBeforeDrag, currentOrder)) {
                    return;
                }

                try {
                    await persistOrder(currentOrder);
                    lastSavedOrder = [...currentOrder];
                    undoOrder = [...orderBeforeDrag];
                    showToast("Order changed successfully.", "update", {
                        actionLabel: "Undo",
                        onAction: handleUndo,
                        duration: 5000,
                    });
                } catch {
                    applyOrder(lastSavedOrder);
                    showToast("Could not save the new order.", "error");
                }
            },
        });
    };

    const ensureListDndReady = async () => {
        try {
            await ensureSortableLoaded();
            initializeListDnd();
        } catch {
            showToast("Could not enable list drag and drop.", "error");
        }
    };

    const showDeleteModal = (form) => {
        if (
            !(form instanceof HTMLFormElement) ||
            !deleteModal ||
            !deleteModalBackdrop ||
            !deleteModalPanel ||
            !deleteModalTask
        ) {
            return;
        }

        pendingDeleteForm = form;
        deleteModalTask.textContent = form.dataset.taskTitle
            ? `Task: ${form.dataset.taskTitle}`
            : "Please confirm task removal.";

        deleteModal.classList.remove("hidden");
        deleteModal.classList.add("flex");

        window.requestAnimationFrame(() => {
            deleteModalBackdrop.classList.remove("opacity-0");
            deleteModalBackdrop.classList.add("opacity-100");
            deleteModalPanel.classList.remove("opacity-0", "scale-95");
            deleteModalPanel.classList.add("opacity-100", "scale-100");
        });
    };

    const hideDeleteModal = () => {
        if (!deleteModal || !deleteModalBackdrop || !deleteModalPanel) {
            return;
        }

        deleteModalBackdrop.classList.remove("opacity-100");
        deleteModalBackdrop.classList.add("opacity-0");
        deleteModalPanel.classList.remove("opacity-100", "scale-100");
        deleteModalPanel.classList.add("opacity-0", "scale-95");

        window.setTimeout(() => {
            deleteModal.classList.remove("flex");
            deleteModal.classList.add("hidden");
        }, 200);
    };

    const clearTaskModalErrors = () => {
        document.querySelectorAll("[data-task-modal-error]").forEach((el) => {
            el.textContent = "";
        });
    };

    const showTaskModal = () => {
        if (!taskModal || !taskModalBackdrop || !taskModalPanel) {
            return;
        }

        taskModal.classList.remove("hidden");
        taskModal.classList.add("flex");

        window.requestAnimationFrame(() => {
            taskModalBackdrop.classList.remove("opacity-0");
            taskModalBackdrop.classList.add("opacity-100");
            taskModalPanel.classList.remove("opacity-0", "scale-95");
            taskModalPanel.classList.add("opacity-100", "scale-100");
        });
    };

    const hideTaskModal = () => {
        if (!taskModal || !taskModalBackdrop || !taskModalPanel) {
            return;
        }

        taskModalBackdrop.classList.remove("opacity-100");
        taskModalBackdrop.classList.add("opacity-0");
        taskModalPanel.classList.remove("opacity-100", "scale-100");
        taskModalPanel.classList.add("opacity-0", "scale-95");

        window.setTimeout(() => {
            taskModal.classList.remove("flex");
            taskModal.classList.add("hidden");
        }, 200);
    };

    const setTaskModalMode = (mode, taskData = null, token = "") => {
        clearTaskModalErrors();

        if (mode === "edit" && taskData) {
            taskModalKicker.textContent = "Update Task";
            taskModalTitle.textContent = "Edit Task";
            taskModalSubmit.textContent = "Update Task";
            taskModalMode.value = "edit";
            taskModalTaskId.value = taskData.id;
            taskModalToken.value = token;
            taskModalInputTitle.value = taskData.title;
            taskModalInputDescription.value = taskData.description;
            taskModalInputStatus.value = taskData.status;
            taskModalInputDueDate.value = taskData.dueDate;

            return;
        }

        taskModalKicker.textContent = "New Task";
        taskModalTitle.textContent = "Add Task";
        taskModalSubmit.textContent = "Create Task";
        taskModalMode.value = "create";
        taskModalTaskId.value = "";
        taskModalToken.value = taskTable.dataset.createToken ?? "";
        taskModalInputTitle.value = "";
        taskModalInputDescription.value = "";
        taskModalInputStatus.value = "pending";
        taskModalInputDueDate.value = "";
    };

    const removeDragPreview = () => {
        if (dragPreview) {
            dragPreview.remove();
            dragPreview = null;
        }
    };

    const createDragPreview = (row) => {
        removeDragPreview();

        const rect = row.getBoundingClientRect();
        const preview = row.cloneNode(true);

        preview.style.position = "fixed";
        preview.style.top = "-9999px";
        preview.style.left = "-9999px";
        preview.style.width = `${rect.width}px`;
        preview.style.backgroundColor = "#ffffff";
        preview.style.borderRadius = "24px";
        preview.style.boxShadow = "0 24px 60px rgba(15, 23, 42, 0.18)";
        preview.style.opacity = "1";
        preview.style.pointerEvents = "none";
        preview.style.overflow = "hidden";

        preview.querySelectorAll("td").forEach((cell) => {
            cell.style.backgroundColor = "#ffffff";
            cell.style.opacity = "1";
        });

        document.body.appendChild(preview);
        dragPreview = preview;

        return preview;
    };

    const getRowAfterPointer = (y) => {
        const rows = [
            ...tbody.querySelectorAll("[data-task-row]:not(.is-dragging)"),
        ];

        return rows.reduce(
            (closest, row) => {
                const box = row.getBoundingClientRect();
                const offset = y - box.top - box.height / 2;

                if (offset < 0 && offset > closest.offset) {
                    return { offset, element: row };
                }

                return closest;
            },
            { offset: Number.NEGATIVE_INFINITY, element: null },
        ).element;
    };

    const updateTaskStatusUi = (taskId, payload) => {
        document
            .querySelectorAll(`[data-status-form][data-task-id="${taskId}"]`)
            .forEach((form) => {
                const scope = form.closest("[data-task-row], [data-task-card]");

                if (!scope) {
                    return;
                }

                const badge = scope.querySelector("[data-status-badge]");
                const helpText = scope.querySelector("[data-status-help]");

                if (badge) {
                    badge.textContent = payload.status.label;
                    badge.className = `inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] ring-1 ring-inset ${payload.status.badgeClasses}`;
                }

                if (helpText) {
                    helpText.textContent = payload.status.helpText;
                }

                const statusSelect = form.querySelector("[data-status-select]");

                if (statusSelect instanceof HTMLSelectElement) {
                    statusSelect.value = payload.status.value;
                    statusSelect.dataset.previousValue = payload.status.value;
                }
            });

        const row = document.querySelector(
            `[data-task-row][data-task-id="${taskId}"]`,
        );
        const card = document.querySelector(
            `[data-task-card][data-task-id="${taskId}"]`,
        );

        if (row instanceof HTMLElement) {
            row.dataset.taskStatus = payload.status.value;
        }

        if (card instanceof HTMLElement) {
            card.dataset.taskStatus = payload.status.value;
        }

        const boardCard = document.querySelector(
            `[data-task-card][data-task-id="${taskId}"]`,
        );
        const targetColumn = document.querySelector(
            `[data-board-column="${payload.status.value}"]`,
        );

        if (boardCard && targetColumn) {
            targetColumn.appendChild(boardCard);
            refreshBoardColumns();
        }
    };

    const removeTaskUi = (taskId) => {
        const row = document.querySelector(
            `[data-task-row][data-task-id="${taskId}"]`,
        );
        const card = document.querySelector(
            `[data-task-card][data-task-id="${taskId}"]`,
        );

        row?.remove();
        card?.remove();

        lastSavedOrder = getCurrentOrder();
        refreshBoardColumns();
        refreshListEmptyState();
    };

    const renderTaskRow = (task, csrf) => {
        const row = document.createElement("tr");
        row.className = "align-top transition hover:bg-slate-50";
        row.dataset.taskRow = "";
        row.dataset.taskId = String(task.id);
        row.dataset.taskTitle = task.title;
        row.dataset.taskDescription = task.description;
        row.dataset.taskStatus = task.status.value;
        row.dataset.taskDueDate = task.dueDate.value;

        row.innerHTML = `
            <td class="px-6 py-5">
                <div class="inline-flex cursor-grab items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-3 text-slate-400 active:cursor-grabbing" data-list-drag-handle>
                    <span class="select-none text-lg leading-none">::</span>
                </div>
            </td>
            <td class="px-6 py-5">
                <div class="text-base font-semibold text-slate-900">${task.title}</div>
            </td>
            <td class="px-6 py-5">
                <div class="max-w-md text-sm leading-6 text-slate-600">${task.descriptionFallback}</div>
            </td>
            <td class="px-6 py-5">
                <div class="space-y-3">
                    <span class="inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] ring-1 ring-inset ${task.status.badgeClasses}" data-status-badge>
                        ${task.status.label}
                    </span>
                    <p class="max-w-56 text-xs leading-5 text-slate-500" data-status-help>
                        ${task.status.helpText}
                    </p>
                    <form method="post" action="/tasks/${task.id}/status" class="flex items-center gap-2" data-status-form data-task-id="${task.id}">
                        <input type="hidden" name="_token" value="${csrf.updateStatus}">
                        <select name="status" class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-200" data-status-select aria-label="Update task status">
                            ${statusOptionsHtml}
                        </select>
                    </form>
                </div>
            </td>
            <td class="px-6 py-5 text-sm text-slate-600">
                <span class="whitespace-nowrap">${task.createdAt.display}</span>
            </td>
            <td class="px-6 py-5">
                <div class="flex flex-col items-stretch gap-3 sm:flex-row sm:justify-end">
                    <button type="button" class="inline-flex items-center justify-center rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-700 transition hover:border-cyan-300 hover:bg-cyan-100" data-open-edit-modal data-task-id="${task.id}" data-task-token="${csrf.edit}">
                        Edit
                    </button>
                    <form method="post" action="/tasks/${task.id}" data-delete-task-form data-task-id="${task.id}" data-task-title="${task.title}">
                        <input type="hidden" name="_token" value="${csrf.delete}">
                        <button type="submit" class="inline-flex w-full items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100">
                            Delete
                        </button>
                    </form>
                </div>
            </td>
        `;

        const select = row.querySelector("[data-status-select]");
        if (select instanceof HTMLSelectElement) {
            select.value = task.status.value;
            select.dataset.previousValue = task.status.value;
        }

        return row;
    };

    const renderTaskCard = (task, csrf) => {
        const card = document.createElement("article");
        card.className =
            "rounded-[1.4rem] border border-slate-200 bg-white p-4 shadow-sm transition duration-150 hover:border-cyan-200";
        card.dataset.taskCard = "";
        card.dataset.taskId = String(task.id);
        card.dataset.taskTitle = task.title;
        card.dataset.taskDescription = task.description;
        card.dataset.taskStatus = task.status.value;
        card.dataset.taskDueDate = task.dueDate.value;

        card.innerHTML = `
            <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                    <p class="text-base font-bold text-slate-900">${task.title}</p>
                    <p class="mt-2 text-sm leading-6 text-slate-600">${task.descriptionFallback}</p>
                </div>
                <div class="flex shrink-0 items-center gap-2">
                    <button type="button" class="inline-flex items-center justify-center rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-700 transition hover:border-cyan-300 hover:bg-cyan-100" data-open-edit-modal data-task-id="${task.id}" data-task-token="${csrf.edit}">Edit</button>
                    <form method="post" action="/tasks/${task.id}" data-delete-task-form data-task-id="${task.id}" data-task-title="${task.title}">
                        <input type="hidden" name="_token" value="${csrf.delete}">
                        <button type="submit" class="text-xs font-semibold text-slate-400 transition hover:text-rose-600" aria-label="Delete task" title="Delete task">
                            Delete
                        </button>
                    </form>
                </div>
            </div>
            <div class="mt-4 flex items-center justify-between gap-3">
                <span class="inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] ring-1 ring-inset ${task.status.badgeClasses}" data-status-badge>${task.status.label}</span>
                <span class="whitespace-nowrap text-xs font-medium text-slate-500">${task.createdAt.display}</span>
            </div>
            <p class="mt-3 text-xs leading-5 text-slate-500" data-status-help>${task.status.helpText}</p>
            <form method="post" action="/tasks/${task.id}/status" class="mt-4" data-status-form data-task-id="${task.id}">
                <input type="hidden" name="_token" value="${csrf.updateStatus}">
                <select name="status" class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-200" data-status-select aria-label="Update task status">
                    ${statusOptionsHtml}
                </select>
            </form>
        `;

        const select = card.querySelector("[data-status-select]");
        if (select instanceof HTMLSelectElement) {
            select.value = task.status.value;
            select.dataset.previousValue = task.status.value;
        }

        return card;
    };

    const wireDragRow = (row) => {
        if (
            !(row instanceof HTMLTableRowElement) ||
            row.dataset.dragWired === "1"
        ) {
            return;
        }

        row.dataset.dragWired = "1";
        row.draggable = true;

        const onDragStart = (event) => {
            orderBeforeDrag = getCurrentOrder();
            draggedRow = row;
            row.classList.add("is-dragging");

            const preview = createDragPreview(row);

            if (event.dataTransfer) {
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData(
                    "text/plain",
                    row.dataset.taskId ?? "",
                );
                event.dataTransfer.setDragImage(preview, 32, 24);
            }
        };

        const onDragEnd = async () => {
            row.classList.remove("is-dragging");
            draggedRow = null;
            removeDragPreview();

            const currentOrder = getCurrentOrder();

            if (ordersMatch(orderBeforeDrag, currentOrder)) {
                return;
            }

            try {
                await persistOrder(currentOrder);
                lastSavedOrder = [...currentOrder];
                undoOrder = [...orderBeforeDrag];
                showToast("Order changed successfully.", "update", {
                    actionLabel: "Undo",
                    onAction: handleUndo,
                    duration: 5000,
                });
            } catch {
                applyOrder(lastSavedOrder);
                showToast("Could not save the new order.", "error");
            }
        };

        row.addEventListener("dragstart", onDragStart);
        row.addEventListener("dragend", onDragEnd);

        row.dataset.dragStartHandler = "1";
    };

    const wireAllRows = () => {
        tbody.querySelectorAll("[data-task-row]").forEach((row) => {
            wireDragRow(row);
        });
    };

    const initializeBoardDnd = () => {
        if (boardDndInitialized || typeof window.Sortable === "undefined") {
            return;
        }

        boardDndInitialized = true;

        document.querySelectorAll("[data-board-column]").forEach((column) => {
            const sortable = new window.Sortable(column, {
                group: "task-board-columns",
                animation: 170,
                draggable: "[data-task-card]",
                ghostClass: "task-card-ghost",
                chosenClass: "task-card-chosen",
                dragClass: "task-card-dragging",
                forceFallback: false,
                onStart: () => {
                    document
                        .querySelectorAll("[data-board-column]")
                        .forEach((zone) =>
                            zone.classList.add("is-drop-active"),
                        );
                },
                onEnd: async (event) => {
                    document
                        .querySelectorAll("[data-board-column]")
                        .forEach((zone) =>
                            zone.classList.remove("is-drop-active"),
                        );

                    const card = event.item;

                    if (!(card instanceof HTMLElement)) {
                        refreshBoardColumns();
                        return;
                    }

                    const taskId = card.dataset.taskId ?? "";
                    const statusForm = card.querySelector("[data-status-form]");
                    const targetColumn = event.to;
                    const targetStatus =
                        targetColumn?.dataset.boardColumn ?? "";
                    const previousColumn = event.from;
                    const previousStatus =
                        previousColumn?.dataset.boardColumn ?? "";

                    refreshBoardColumns();

                    if (
                        !(statusForm instanceof HTMLFormElement) ||
                        !taskId ||
                        !targetStatus ||
                        targetStatus === previousStatus
                    ) {
                        return;
                    }

                    const statusSelect = statusForm.querySelector(
                        "[data-status-select]",
                    );
                    const isUpdated = await requestStatusUpdate(
                        statusForm,
                        targetStatus,
                        statusSelect instanceof HTMLSelectElement
                            ? statusSelect
                            : null,
                        previousStatus,
                    );

                    if (!isUpdated && previousColumn) {
                        previousColumn.appendChild(card);
                        refreshBoardColumns();
                    }
                },
            });

            boardSortables.push(sortable);
        });
    };

    const ensureBoardDndReady = async () => {
        try {
            await ensureSortableLoaded();
            initializeBoardDnd();
        } catch {
            showToast("Could not enable board drag and drop.", "error");
        }
    };

    const addTaskToUi = (task, csrf) => {
        const existingRow = document.querySelector(
            `[data-task-row][data-task-id="${task.id}"]`,
        );
        const existingCard = document.querySelector(
            `[data-task-card][data-task-id="${task.id}"]`,
        );

        if (existingRow && existingCard) {
            updateTaskDataInDom(task);

            const targetColumn = document.querySelector(
                `[data-board-column="${task.status.value}"]`,
            );

            if (targetColumn && existingCard.parentElement !== targetColumn) {
                targetColumn.appendChild(existingCard);
            }

            refreshBoardColumns();
            return;
        }

        const row = renderTaskRow(task, csrf);
        const column = document.querySelector(
            `[data-board-column="${task.status.value}"]`,
        );
        const card = renderTaskCard(task, csrf);

        const emptyRow = tbody.querySelector("[data-list-empty-row]");
        emptyRow?.remove();

        tbody.appendChild(row);

        if (column) {
            column.appendChild(card);
        }

        refreshBoardColumns();
        refreshListEmptyState();
        lastSavedOrder = getCurrentOrder();
    };

    const handleUndo = async () => {
        if (!undoOrder) {
            return;
        }

        const previousOrder = [...undoOrder];

        applyOrder(previousOrder);

        try {
            await persistOrder(previousOrder);
            lastSavedOrder = [...previousOrder];
            showToast("Order restored.", "update");
        } catch {
            applyOrder(lastSavedOrder);
            showToast("Could not restore the previous order.", "error");
        }
    };

    const handleDragOver = (event) => {
        event.preventDefault();

        if (!draggedRow) {
            return;
        }

        latestDragY = event.clientY;

        if (dragOverRafId !== null) {
            return;
        }

        dragOverRafId = window.requestAnimationFrame(() => {
            dragOverRafId = null;

            if (!draggedRow || latestDragY === null) {
                return;
            }

            const nextRow = getRowAfterPointer(latestDragY);

            if (!nextRow) {
                tbody.appendChild(draggedRow);

                return;
            }

            if (nextRow !== draggedRow) {
                tbody.insertBefore(draggedRow, nextRow);
            }
        });
    };

    const requestStatusUpdate = async (
        form,
        statusValue,
        rollbackSelect = null,
        rollbackValue = null,
    ) => {
        const formData = new FormData(form);
        const taskId = form.dataset.taskId ?? "";

        formData.set("status", statusValue);

        try {
            const response = await fetch(form.action, {
                method: "POST",
                headers: {
                    "X-Requested-With": "XMLHttpRequest",
                },
                body: formData,
            });

            const payload = await parseResponseJson(response);

            if (!response.ok) {
                throw new Error();
            }

            updateTaskStatusUi(taskId, payload);
            showToast(payload.message, "update");
            return true;
        } catch {
            if (rollbackSelect instanceof HTMLSelectElement && rollbackValue) {
                rollbackSelect.value = rollbackValue;
            }

            showToast("Could not update the task status.", "error");
            return false;
        }
    };

    const handleTaskModalSubmit = async (event) => {
        event.preventDefault();

        clearTaskModalErrors();

        const mode = taskModalMode.value;
        const taskId = taskModalTaskId.value;

        const formData = new FormData();
        formData.set("_token", taskModalToken.value);
        formData.set("title", taskModalInputTitle.value.trim());
        formData.set("description", taskModalInputDescription.value.trim());
        formData.set("status", taskModalInputStatus.value);
        formData.set("dueDate", taskModalInputDueDate.value);

        if (!formData.get("title")) {
            document.querySelector(
                '[data-task-modal-error="title"]',
            ).textContent = "Please enter a task title.";
            return;
        }

        const url =
            mode === "edit"
                ? getEditUrl(taskId)
                : (taskTable.dataset.createUrl ?? "");

        taskModalSubmit.disabled = true;
        taskModalSubmit.classList.add("opacity-70");

        let saveSucceeded = false;

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "X-Requested-With": "XMLHttpRequest",
                },
                body: formData,
            });

            const payload = await parseResponseJson(response);

            if (response.ok && response.redirected && response.url) {
                window.location.assign(response.url);
                return;
            }

            if (!response.ok) {
                if (payload.errors) {
                    Object.entries(payload.errors).forEach(([key, message]) => {
                        const errorEl = document.querySelector(
                            `[data-task-modal-error="${key}"]`,
                        );

                        if (errorEl) {
                            errorEl.textContent = String(message);
                        }
                    });
                }

                document.querySelector(
                    '[data-task-modal-error="form"]',
                ).textContent =
                    payload.message ?? "Please review the form and try again.";

                return;
            }

            saveSucceeded = true;

            const responseTask = payload.task;
            if (!responseTask || typeof responseTask.id !== "number") {
                document.querySelector(
                    '[data-task-modal-error="form"]',
                ).textContent =
                    "Task was saved, but we could not refresh this view. Please reload the page.";

                return;
            }

            const csrf = payload.csrf ?? {
                delete:
                    document.querySelector(
                        `[data-delete-task-form][data-task-id="${responseTask.id}"] input[name="_token"]`,
                    )?.value ?? "",
                updateStatus:
                    document.querySelector(
                        `[data-status-form][data-task-id="${responseTask.id}"] input[name="_token"]`,
                    )?.value ?? "",
                edit:
                    document.querySelector(
                        `[data-open-edit-modal][data-task-id="${responseTask.id}"]`,
                    )?.dataset.taskToken ?? "",
            };

            addTaskToUi(responseTask, csrf);

            if (mode === "edit") {
                const editButtons = document.querySelectorAll(
                    `[data-open-edit-modal][data-task-id="${responseTask.id}"]`,
                );
                editButtons.forEach((button) => {
                    button.dataset.taskToken = taskModalToken.value;
                });
            }

            hideTaskModal();
            showToast(
                payload.message ??
                    (mode === "edit"
                        ? "Task updated successfully."
                        : "Task added successfully."),
                mode === "edit" ? "update" : "create",
            );
        } catch {
            document.querySelector(
                '[data-task-modal-error="form"]',
            ).textContent = saveSucceeded
                ? "Task was saved, but we could not refresh this view. Please reload the page."
                : "Unable to save the task right now.";
        } finally {
            taskModalSubmit.disabled = false;
            taskModalSubmit.classList.remove("opacity-70");
        }
    };

    const handleDeleteConfirm = async () => {
        if (!pendingDeleteForm) {
            hideDeleteModal();

            return;
        }

        const targetForm = pendingDeleteForm;
        const taskId = Number.parseInt(targetForm.dataset.taskId ?? "", 10);
        pendingDeleteForm = null;
        hideDeleteModal();

        try {
            const response = await fetch(targetForm.action, {
                method: "POST",
                headers: {
                    "X-Requested-With": "XMLHttpRequest",
                },
                body: new FormData(targetForm),
            });

            const payload = await parseResponseJson(response);

            if (!response.ok) {
                throw new Error();
            }

            if (Number.isInteger(taskId)) {
                removeTaskUi(taskId);
            }

            showToast(
                payload.message ?? "Task deleted successfully.",
                "delete",
            );
        } catch {
            showToast("Could not delete the task.", "error");
        }
    };

    const handleDeleteCancel = () => {
        pendingDeleteForm = null;
        hideDeleteModal();
    };

    const handleDocumentClick = (event) => {
        const target = event.target;

        if (!(target instanceof Element)) {
            return;
        }

        const createTrigger = target.closest("[data-open-create-modal]");

        if (createTrigger) {
            setTaskModalMode("create");
            showTaskModal();
            return;
        }

        const editTrigger = target.closest("[data-open-edit-modal]");

        if (editTrigger instanceof HTMLElement) {
            const taskId = editTrigger.dataset.taskId;
            const token = editTrigger.dataset.taskToken ?? "";

            if (!taskId) {
                return;
            }

            const container = getTaskContainerById(taskId);
            const taskData = getTaskDataFromContainer(container);

            if (!taskData) {
                return;
            }

            setTaskModalMode("edit", taskData, token);
            showTaskModal();
            return;
        }

        const deleteForm = target.closest("[data-delete-task-form]");

        if (deleteForm instanceof HTMLFormElement) {
            event.preventDefault();
            showDeleteModal(deleteForm);
        }
    };

    const handleDocumentChange = (event) => {
        const target = event.target;

        if (!(target instanceof HTMLSelectElement)) {
            return;
        }

        if (!target.matches("[data-status-select]")) {
            return;
        }

        const form = target.closest("[data-status-form]");

        if (!(form instanceof HTMLFormElement)) {
            return;
        }

        const previousValue = target.dataset.previousValue ?? "";
        void requestStatusUpdate(form, target.value, target, previousValue);
    };

    const handleEscape = (event) => {
        if (event.key !== "Escape") {
            return;
        }

        if (!taskModal?.classList.contains("hidden")) {
            hideTaskModal();
            return;
        }

        if (!deleteModal?.classList.contains("hidden")) {
            handleDeleteCancel();
        }
    };

    const handleTaskModalCancel = () => {
        hideTaskModal();
    };

    refreshBoardColumns();
    refreshListEmptyState();
    activateLayout(window.localStorage.getItem("task-layout-view") ?? "list");
    void ensureListDndReady();
    if (
        (window.localStorage.getItem("task-layout-view") ?? "list") === "board"
    ) {
        void ensureBoardDndReady();
    }
    lastSavedOrder = getCurrentOrder();

    flashMessages.forEach((messageElement) => {
        const variant = messageElement.dataset.flashVariant ?? "info";
        const text = messageElement.textContent?.trim();

        if (text) {
            showToast(text, variant, { duration: 4300 });
        }
    });

    layoutButtons.forEach((button) => {
        button.addEventListener("click", () => {
            activateLayout(button.dataset.layoutTarget ?? "list");
        });
    });

    document.addEventListener("click", handleDocumentClick);
    document.addEventListener("change", handleDocumentChange);
    document.addEventListener("keydown", handleEscape);
    deleteModalCancel?.addEventListener("click", handleDeleteCancel);
    deleteModalConfirm?.addEventListener("click", handleDeleteConfirm);
    deleteModalBackdrop?.addEventListener("click", handleDeleteCancel);

    taskModalForm.addEventListener("submit", handleTaskModalSubmit);
    taskModalClose?.addEventListener("click", handleTaskModalCancel);
    taskModalCancel?.addEventListener("click", handleTaskModalCancel);
    taskModalBackdrop?.addEventListener("click", handleTaskModalCancel);

    cleanupTaskPage = () => {
        document.removeEventListener("click", handleDocumentClick);
        document.removeEventListener("change", handleDocumentChange);
        document.removeEventListener("keydown", handleEscape);
        deleteModalCancel?.removeEventListener("click", handleDeleteCancel);
        deleteModalConfirm?.removeEventListener("click", handleDeleteConfirm);
        deleteModalBackdrop?.removeEventListener("click", handleDeleteCancel);

        taskModalForm.removeEventListener("submit", handleTaskModalSubmit);
        taskModalClose?.removeEventListener("click", handleTaskModalCancel);
        taskModalCancel?.removeEventListener("click", handleTaskModalCancel);
        taskModalBackdrop?.removeEventListener("click", handleTaskModalCancel);

        removeDragPreview();
        boardSortables.forEach((sortable) => sortable.destroy());
        boardSortables.length = 0;
        listSortable?.destroy();
        listSortable = null;
        listDndInitialized = false;
        boardDndInitialized = false;
        if (dragOverRafId !== null) {
            window.cancelAnimationFrame(dragOverRafId);
            dragOverRafId = null;
        }
        latestDragY = null;
        pendingDeleteForm = null;
        hideDeleteModal();
        hideTaskModal();
        toasts.destroy();
    };
};

document.addEventListener("turbo:load", initializeTaskPage);

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeTaskPage, {
        once: true,
    });
} else {
    initializeTaskPage();
}
