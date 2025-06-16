let boardsData = [];
let currentBoardDetails = null;
let selectedBoardId = null;

const API_BASE_URL = 'http://localhost:3000/api';

//Board Functions
async function fetchBoards() {
  try {
    const response = await fetch(`${API_BASE_URL}/boards`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    if (result.success) {
      boardsData = result.data.map(b => ({
          board_id: b.board_id, 
          name: b.boardName
      }));
      renderBoardList();
    } else {
      console.error("Failed to fetch boards:", result.message);
    }
  } catch (error) {
    console.error("Error fetching boards:", error);
  }
}

async function addBoard() {
  const name = document.getElementById('boardNameInput').value.trim();
  if (!name) return;

  try {
    const response = await fetch(`${API_BASE_URL}/boards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    if (result.success) {
      fetchBoards();
      document.getElementById('boardNameInput').value = '';
    } else {
      alert(`Failed to add board: ${result.message}`);
    }
  } catch (err) {
    console.error('Failed to add board:', err);
    alert('Error adding board. See console for details.');
  }
}

async function deleteBoardFromFrontend(boardId) {
  if (!confirm("Are you sure you want to delete this board and all its contents?")) return;

  try {
    const response = await fetch(`${API_BASE_URL}/boards/${boardId}`, { method: 'DELETE' });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();

    if (result.success) {
      if (selectedBoardId === boardId) {
        selectedBoardId = null;
        currentBoardDetails = null;
        document.getElementById('boardTitle').textContent = 'WELCOME TO KANBAN BOARD';
        document.getElementById('tasklists').innerHTML = '';
      }
      fetchBoards();
    } else {
      alert(`Failed to delete board: ${result.message}`);
    }
  } catch (err) {
    console.error('Failed to delete board:', err);
    alert('Error deleting board. See console for details.');
  }
}

async function editBoardName(boardId, currentName) {
  const newName = prompt("Edit board name:", currentName);
  if (newName && newName.trim() !== "" && newName !== currentName) {
    try {
      const response = await fetch(`${API_BASE_URL}/boards/${boardId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() })
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      if (result.success) {
        fetchBoards();
        if (selectedBoardId === boardId) {
          document.getElementById('boardTitle').textContent = newName.trim();
          if (currentBoardDetails) currentBoardDetails.boardName = newName.trim();
        }
      } else {
        alert(`Failed to update board: ${result.message}`);
      }
    } catch (err) {
      console.error('Failed to update board:', err);
      alert('Error updating board. See console for details.');
    }
  }
}

function renderBoardList() {
  const boardsEl = document.getElementById('boards');
  boardsEl.innerHTML = ''; 
  boardsData.forEach(board => { 
    const boardDiv = document.createElement('div');
    boardDiv.className = 'board-box';
    boardDiv.innerHTML = `<strong>${board.name}</strong><br>`; 

    const viewBtn = document.createElement('button');
    viewBtn.innerHTML = '📋';
    viewBtn.onclick = () => {
      selectedBoardId = board.board_id;
      fetchAndRenderBoardDetails(board.board_id);
    };
    boardDiv.appendChild(viewBtn);

    const editBtn = document.createElement('button');
    editBtn.innerHTML = '✏️';
    editBtn.onclick = () => editBoardName(board.board_id, board.name);
    boardDiv.appendChild(editBtn);

    const addListBtn = document.createElement('button');
    addListBtn.innerHTML = '➕ ';
    addListBtn.onclick = () => {
        if (selectedBoardId !== board.board_id) {
            alert("Please view the board first to add a task list.");
            selectedBoardId = board.board_id;
            fetchAndRenderBoardDetails(board.board_id, () => addTasklistToCurrentBoard());
            return;
        }
        addTasklistToCurrentBoard();
    };
    boardDiv.appendChild(addListBtn);

    const deleteBoardBtn = document.createElement('button');
    deleteBoardBtn.innerHTML = '🗑️';
    deleteBoardBtn.onclick = () => deleteBoardFromFrontend(board.board_id);
    boardDiv.appendChild(deleteBoardBtn);

    boardsEl.appendChild(boardDiv);
  });
}

//Board Details, Lists, and Tasks
async function fetchAndRenderBoardDetails(boardId, callback) {
  if (!boardId) {
    document.getElementById('boardTitle').textContent = 'WELCOME TO KANBAN BOARD';
    document.getElementById('tasklists').innerHTML = '';
    currentBoardDetails = null;
    return;
  }
  try {
    const response = await fetch(`${API_BASE_URL}/boards/${boardId}`);
    if (!response.ok) {
        if(response.status === 404) {
            alert("Board not found. It might have been deleted.");
            selectedBoardId = null;
            fetchBoards();
            fetchAndRenderBoardDetails(null);
        }
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    if (result.success) {
      currentBoardDetails = result.data;
      selectedBoardId = currentBoardDetails.board_id;
      renderCurrentBoard();
      if (callback) callback();
    } else {
      alert(`Failed to fetch board details: ${result.message}`);
      document.getElementById('boardTitle').textContent = 'Error loading board';
      document.getElementById('tasklists').innerHTML = '';
    }
  } catch (err) {
    console.error('Failed to fetch board details:', err);
    alert('Error fetching board details. See console for details.');
    document.getElementById('boardTitle').textContent = 'Error loading board';
    document.getElementById('tasklists').innerHTML = '';
  }
}

function renderCurrentBoard() {
  const titleEl = document.getElementById('boardTitle');
  const tasklistsContainer = document.getElementById('tasklists');

  if (!currentBoardDetails) {
    titleEl.textContent = 'Select a board or create a new one.';
    tasklistsContainer.innerHTML = '';
    return;
  }
 
  titleEl.textContent = currentBoardDetails.boardName || currentBoardDetails.name; 
  tasklistsContainer.innerHTML = '';

  (currentBoardDetails.lists || []).forEach(list => {
    const listDiv = document.createElement('div');
    listDiv.className = 'tasklist';
    listDiv.dataset.listId = list.list_id;

    const listHeader = document.createElement('div');
    listHeader.className = 'tasklist-header';

    const listTitleEl = document.createElement('h4');
    listTitleEl.textContent = list.listName;
    listTitleEl.onclick = () => editListName(list.list_id, list.listName);

    const deleteListBtn = document.createElement('button');
    deleteListBtn.className = 'delete-btn';
    deleteListBtn.textContent = '🗑️';
    deleteListBtn.onclick = () => deleteListFromFrontend(list.list_id);

    listHeader.appendChild(listTitleEl);
    listHeader.appendChild(deleteListBtn);

    const ul = document.createElement('ul');
    ul.dataset.listId = list.list_id;

    (list.tasks || []).forEach(task => {
      const li = document.createElement('li');
      li.dataset.taskId = task.task_id;
      li.innerHTML = `
        <span><strong>${task.taskName}</strong></span>
        ${task.assignedTo ? `<div>👤 ${task.assignedTo}</div>` : ''}
        ${task.dueDate ? `<div>📅 Due: ${new Date(task.dueDate).toLocaleDateString()}</div>` : ''}
      `;

      const span = li.querySelector('span');
      span.onclick = () => editTask(task);

      const delBtn = document.createElement('button');
      delBtn.className = 'delete-btn';
      delBtn.textContent = '🗑️';
      delBtn.onclick = () => deleteTaskFromFrontend(task.task_id);

      li.appendChild(delBtn);
      ul.appendChild(li);
    });

    const addTaskBtn = document.createElement('button');
    addTaskBtn.className = 'add-task-btn';
    addTaskBtn.textContent = 'Add Task';
    addTaskBtn.onclick = () => addNewTaskToLis(list.list_id);

    listDiv.appendChild(listHeader);
    listDiv.appendChild(ul);
    listDiv.appendChild(addTaskBtn);
    tasklistsContainer.appendChild(listDiv);

    
    Sortable.create(ul, {
      group: 'shared-tasks',
      animation: 150,
      draggable: 'li',
      dataIdAttr: 'data-task-id',
      onEnd: async function (evt) {
        const taskId = evt.item.dataset.taskId;
        const toListEl = evt.to;
        const fromListEl = evt.from;
        const toListId = toListEl.dataset.listId;
        
        const orderedTaskIds = Array.from(toListEl.children).map(item => item.dataset.taskId);

        try {
        
          const response = await fetch(`${API_BASE_URL}/lists/${toListId}/tasks/order`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                orderedTaskIds: orderedTaskIds,
               
            })
          });
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          const result = await response.json();
          if (result.success) {
            if (fromListEl !== toListEl) {
                const fromListId = fromListEl.dataset.listId;
                const fromOrderedTaskIds = Array.from(fromListEl.children).map(item => item.dataset.taskId);
                 await fetch(`${API_BASE_URL}/lists/${fromListId}/tasks/order`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ orderedTaskIds: fromOrderedTaskIds })
                });
            }
            fetchAndRenderBoardDetails(selectedBoardId);
          } else {
            alert(`Failed to update task order: ${result.message}`);
            fetchAndRenderBoardDetails(selectedBoardId);
          }
        } catch (error) {
          console.error("Error updating task order:", error);
          fetchAndRenderBoardDetails(selectedBoardId);
        }
      }
    });
  });


  if (tasklistsContainer.children.length > 0) {
    Sortable.create(tasklistsContainer, {
      animation: 150,
      direction: 'horizontal',
      draggable: '.tasklist',
      dataIdAttr: 'data-list-id',
      onEnd: async function (evt) {
        const orderedListIds = Array.from(tasklistsContainer.children).map(listElement => listElement.dataset.listId);
        
        try {
            const response = await fetch(`${API_BASE_URL}/boards/${selectedBoardId}/lists/order`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderedListIds })
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const result = await response.json();
            if (result.success) {
                fetchAndRenderBoardDetails(selectedBoardId);
            } else {
                alert(`Failed to update list order: ${result.message}`);
                fetchAndRenderBoardDetails(selectedBoardId);
            }
        } catch (error) {
            console.error("Error updating list order:", error);
            fetchAndRenderBoardDetails(selectedBoardId);
        }
      }
    });
  }
}


async function addTasklistToCurrentBoard() {
  if (!selectedBoardId) {
    alert("Please select a board first!");
    return;
  }
  const name = prompt('Enter new tasklist name:');
  if (!name || name.trim() === "") return;

  try {
    const response = await fetch(`${API_BASE_URL}/boards/${selectedBoardId}/lists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() })
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    if (result.success) {
      fetchAndRenderBoardDetails(selectedBoardId); // Refresh the board
    } else {
      alert(`Failed to add tasklist: ${result.message}`);
    }
  } catch (err) {
    console.error('Failed to add tasklist:', err);
    alert('Error adding tasklist. See console for details.');
  }
}

async function editListName(listId, currentName) {
  const newName = prompt("Edit list name:", currentName);
  if (newName && newName.trim() !== "" && newName !== currentName) {
    try {
      const response = await fetch(`${API_BASE_URL}/lists/${listId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() })
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      if (result.success) {
        fetchAndRenderBoardDetails(selectedBoardId);
      } else {
        alert(`Failed to update list name: ${result.message}`);
      }
    } catch (err) {
      console.error('Failed to update list name:', err);
      alert('Error updating list name. See console for details.');
    }
  }
}

async function deleteListFromFrontend(listId) {
  if (!confirm("Are you sure you want to delete this tasklist and all its tasks?")) return;
  try {
    const response = await fetch(`${API_BASE_URL}/lists/${listId}`, { method: 'DELETE' });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    if (result.success) {
      fetchAndRenderBoardDetails(selectedBoardId);
    } else {
      alert(`Failed to delete list: ${result.message}`);
    }
  } catch (err) {
    console.error('Failed to delete list:', err);
    alert('Error deleting list. See console for details.');
  }
}

//Task Functions
async function addNewTaskToLis(listId) {
  const text = prompt('Enter task title:');
  if (!text || text.trim() === "") return;
  const assignedTo = prompt('Assign to (leave blank if none):');
  const dueDate = prompt('Enter due date (YYYY-MM-DD, leave blank if none):');

  const taskData = {
    text: text.trim(),
    assignedTo: assignedTo ? assignedTo.trim() : null,
    dueDate: dueDate ? dueDate.trim() : null
  };

  try {
    const response = await fetch(`${API_BASE_URL}/lists/${listId}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData)
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    if (result.success) {
      fetchAndRenderBoardDetails(selectedBoardId);
    } else {
      alert(`Failed to add task: ${result.message}`);
    }
  } catch (err) {
    console.error('Failed to add task:', err);
    alert('Error adding task. See console for details.');
  }
}

async function editTask(task) {
  const updatedText = prompt("Edit task title:", task.taskName);
  if (updatedText === null) return;

  const updatedAssignedTo = prompt("Edit 'Assign to':", task.assignedTo || '');
  const updatedDueDate = prompt("Edit due date (YYYY-MM-DD):", task.dueDate ? task.dueDate.split('T')[0] : '');

  const taskData = {
    text: updatedText.trim(),
    assignedTo: updatedAssignedTo ? updatedAssignedTo.trim() : null,
    dueDate: updatedDueDate ? updatedDueDate.trim() : null
  };
  
  try {
    const response = await fetch(`${API_BASE_URL}/tasks/${task.task_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData)
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    if (result.success) {
      fetchAndRenderBoardDetails(selectedBoardId);
    } else {
      alert(`Failed to update task: ${result.message}`);
    }
  } catch (err) {
    console.error('Failed to update task:', err);
    alert('Error updating task. See console for details.');
  }
}

async function deleteTaskFromFrontend(taskId) {
  if (!confirm("Are you sure you want to delete this task?")) return;
  try {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, { method: 'DELETE' });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    if (result.success) {
      fetchAndRenderBoardDetails(selectedBoardId);
    } else {
      alert(`Failed to delete task: ${result.message}`);
    }
  } catch (err) {
    console.error('Failed to delete task:', err);
    alert('Error deleting task. See console for details.');
  }
}



document.addEventListener('DOMContentLoaded', () => {
  fetchBoards();
  document.getElementById('boardTitle').textContent = 'WELCOME TO YOUR WORKING SPACE...';
  document.getElementById('tasklists').innerHTML = '';
});