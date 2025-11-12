let tasks = [];
let editingTaskId = null;
let currentFilter = 'all';

// Load tasks from localStorage on page load
window.onload = function() {
    loadTasks();
    renderTasks();
    checkDeadlines();
    setInterval(checkDeadlines, 60000); // Check every minute
};

function loadTasks() {
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
        tasks = JSON.parse(savedTasks);
    }
}

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function showNotification(message) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.classList.remove('hidden');
    setTimeout(() => {
        notification.classList.add('hidden');
    }, 5000);
}

function toggleForm() {
    const form = document.getElementById('taskForm');
    const toggleText = document.getElementById('formToggleText');
    
    if (form.classList.contains('hidden')) {
        form.classList.remove('hidden');
        toggleText.textContent = '❌ Cancel';
    } else {
        cancelForm();
    }
}

function cancelForm() {
    document.getElementById('taskForm').classList.add('hidden');
    document.getElementById('formToggleText').textContent = '➕ New Task';
    document.getElementById('formTitle').textContent = 'Create New Task';
    document.getElementById('saveButtonText').textContent = 'Add Task';
    document.getElementById('taskTitle').value = '';
    document.getElementById('taskDescription').value = '';
    document.getElementById('taskDate').value = '';
    document.getElementById('taskTime').value = '';
    editingTaskId = null;
}

function saveTask() {
    const title = document.getElementById('taskTitle').value.trim();
    const description = document.getElementById('taskDescription').value.trim();
    const date = document.getElementById('taskDate').value;
    const time = document.getElementById('taskTime').value;

    if (!title) {
        showNotification('❌ Please enter a task title');
        return;
    }

    const dueDate = date ? (time ? `${date}T${time}` : `${date}T23:59`) : '';

    if (editingTaskId) {
        // Update existing task
        const taskIndex = tasks.findIndex(t => t.id === editingTaskId);
        tasks[taskIndex] = {
            ...tasks[taskIndex],
            title,
            description,
            dueDate
        };
        showNotification('✅ Task updated successfully!');
    } else {
        // Add new task
        const newTask = {
            id: Date.now(),
            title,
            description,
            dueDate,
            completed: false,
            createdAt: new Date().toISOString()
        };
        tasks.push(newTask);
        showNotification('✅ Task added successfully!');
    }

    saveTasks();
    renderTasks();
    cancelForm();
}

function editTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    editingTaskId = id;
    document.getElementById('taskTitle').value = task.title;
    document.getElementById('taskDescription').value = task.description || '';
    
    if (task.dueDate) {
        const [date, time] = task.dueDate.split('T');
        document.getElementById('taskDate').value = date;
        document.getElementById('taskTime').value = time || '';
    }

    document.getElementById('taskForm').classList.remove('hidden');
    document.getElementById('formTitle').textContent = 'Edit Task';
    document.getElementById('saveButtonText').textContent = 'Update Task';
    document.getElementById('formToggleText').textContent = '❌ Cancel';
}

function deleteTask(id) {
    if (confirm('Are you sure you want to delete this task?')) {
        tasks = tasks.filter(t => t.id !== id);
        saveTasks();
        renderTasks();
        showNotification('🗑️ Task deleted');
    }
}

function toggleComplete(id) {
    const taskIndex = tasks.findIndex(t => t.id === id);
    tasks[taskIndex].completed = !tasks[taskIndex].completed;
    saveTasks();
    renderTasks();
}

function filterTasks(filter) {
    currentFilter = filter;
    
    // Update filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    renderTasks();
}

function getFilteredTasks() {
    switch (currentFilter) {
        case 'active':
            return tasks.filter(t => !t.completed);
        case 'completed':
            return tasks.filter(t => t.completed);
        case 'today':
            return tasks.filter(t => {
                if (!t.dueDate) return false;
                const taskDate = new Date(t.dueDate).toDateString();
                const today = new Date().toDateString();
                return taskDate === today;
            });
        default:
            return tasks;
    }
}

function isOverdue(task) {
    if (!task.dueDate || task.completed) return false;
    return new Date(task.dueDate) < new Date();
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function renderTasks() {
    const filteredTasks = getFilteredTasks();
    const taskList = document.getElementById('taskList');

    // Update counts
    document.getElementById('countAll').textContent = tasks.length;
    document.getElementById('countActive').textContent = tasks.filter(t => !t.completed).length;
    document.getElementById('countCompleted').textContent = tasks.filter(t => t.completed).length;

    // Update statistics
    if (tasks.length > 0) {
        document.getElementById('stats').classList.remove('hidden');
        document.getElementById('statTotal').textContent = tasks.length;
        document.getElementById('statActive').textContent = tasks.filter(t => !t.completed).length;
        document.getElementById('statCompleted').textContent = tasks.filter(t => t.completed).length;
        const progress = Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100);
        document.getElementById('statProgress').textContent = progress + '%';
    } else {
        document.getElementById('stats').classList.add('hidden');
    }

    if (filteredTasks.length === 0) {
        taskList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📝</div>
                <h3>No tasks found</h3>
                <p>${currentFilter === 'all' 
                    ? 'Create your first task to get started!' 
                    : `No ${currentFilter} tasks at the moment.`}</p>
            </div>
        `;
        return;
    }

    taskList.innerHTML = filteredTasks.map(task => `
        <div class="task-item ${task.completed ? 'completed' : ''} ${isOverdue(task) ? 'overdue' : ''}">
            <div class="task-header">
                <div class="task-checkbox ${task.completed ? 'checked' : ''}" 
                     onclick="toggleComplete(${task.id})">
                </div>
                <div class="task-content">
                    <div class="task-title">${task.title}</div>
                    ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                    ${task.dueDate ? `
                        <div class="task-meta ${isOverdue(task) ? 'overdue' : ''}">
                            📅 ${formatDate(task.dueDate)}
                            ${isOverdue(task) ? ' ⚠️ OVERDUE' : ''}
                        </div>
                    ` : ''}
                </div>
            </div>
            <div class="task-actions">
                <button class="btn btn-edit" onclick="editTask(${task.id})">
                    ✏️ Edit
                </button>
                <button class="btn btn-danger" onclick="deleteTask(${task.id})">
                    🗑️ Delete
                </button>
            </div>
        </div>
    `).join('');
}

function checkDeadlines() {
    const now = new Date();
    tasks.forEach(task => {
        if (!task.completed && task.dueDate) {
            const deadline = new Date(task.dueDate);
            const timeDiff = deadline - now;
            const hoursDiff = timeDiff / (1000 * 60 * 60);
            
            // Alert if deadline is within 24 hours
            if (hoursDiff > 0 && hoursDiff <= 24) {
                const hoursLeft = Math.floor(hoursDiff);
                showNotification(`⏰ "${task.title}" is due in ${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''}!`);
            }
        }
    });
}