const express = require("express");
const bodyParser = require("body-parser");
const cors = require('cors');
// const path = require('path');
const queries = require("./queries");
const app = express();

app.use(cors());
app.use(bodyParser.json());
// app.use(express.json());

//Board Routes
app.post("/api/boards", (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: 'Board name is required' });

  queries.createBoard(name, (err, board) => { 
    if (err) {
      console.error("Error Creating Board:", err);
      return res.status(500).json({ success: false, message: "Failed to create board." });
    }
    return res.status(201).json({ success: true, message: "Board created successfully", data: board });
  });
});

app.get("/api/boards", (req, res) => {
  queries.getAllBoards((err, boards) => {
    if (err) {
      console.error("Error fetching boards:", err);
      return res.status(500).json({ message: "Internal Server Error" });
    }
    return res.status(200).json({ success: true, message: "Fetched all boards successfully", data: boards || [] });
  });
});

app.get("/api/boards/:boardId", (req, res) => {
  const { boardId } = req.params;
  queries.getBoardByIdWithDetails(boardId, (err, boardDetails) => {
    if (err) {
      if (err.message === "Board not found") return res.status(404).json({ success: false, message: "Board not found" });
      console.error(`Error fetching board ${boardId} details:`, err);
      return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
    return res.status(200).json({ success: true, data: boardDetails });
  });
});

app.put("/api/boards/:boardId", (req, res) => {
  const { boardId } = req.params;
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: 'New board name is required' });

  queries.updateBoardName(boardId, name, (err, success) => {
    if (err) {
      console.error(`Error updating board ${boardId}:`, err);
      return res.status(500).json({ success: false, message: "Failed to update board." });
    }
    if (!success) return res.status(404).json({ success: false, message: "Board not found or no change made." });
    return res.status(200).json({ success: true, message: "Board updated successfully." });
  });
});

app.delete("/api/boards/:boardId", (req, res) => {
  const { boardId } = req.params;
  queries.deleteBoard(boardId, (err, success) => {
    if (err) {
      console.error(`Error deleting board ${boardId}:`, err);
      return res.status(500).json({ success: false, message: "Failed to delete board." });
    }
    if (!success) return res.status(404).json({ success: false, message: "Board not found." });
    return res.status(200).json({ success: true, message: "Board deleted successfully." });
  });
});


//List Routes
app.post("/api/boards/:boardId/lists", (req, res) => {
  const { boardId } = req.params;
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: 'List name is required' });

  queries.createList(boardId, name, (err, newList) => {
    if (err) {
      console.error(`Error creating list for board ${boardId}:`, err);
      return res.status(500).json({ success: false, message: "Failed to create list." });
    }
    return res.status(201).json({ success: true, message: "List created successfully", data: newList });
  });
});

app.put("/api/lists/:listId", (req, res) => {
  const { listId } = req.params;
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: 'New list name is required' });

  queries.updateListName(listId, name, (err, success) => {
    if (err) {
      console.error(`Error updating list ${listId}:`, err);
      return res.status(500).json({ success: false, message: "Failed to update list." });
    }
    if (!success) return res.status(404).json({ success: false, message: "List not found or no change made." });
    return res.status(200).json({ success: true, message: "List updated successfully." });
  });
});

app.delete("/api/lists/:listId", (req, res) => {
  const { listId } = req.params;
  queries.deleteList(listId, (err, success) => {
    if (err) {
      console.error(`Error deleting list ${listId}:`, err);
      return res.status(500).json({ success: false, message: "Failed to delete list." });
    }
    if (!success) return res.status(404).json({ success: false, message: "List not found." });
    return res.status(200).json({ success: true, message: "List deleted successfully." });
  });
});


//Task Routes
app.post("/api/lists/:listId/tasks", (req, res) => {
  const { listId } = req.params;
  const taskData = req.body; 
  if (!taskData.text) return res.status(400).json({ message: 'Task text is required' });

  queries.createTask(listId, taskData, (err, newTask) => {
    if (err) {
      console.error(`Error creating task for list ${listId}:`, err);
      return res.status(500).json({ success: false, message: "Failed to create task." });
    }
    return res.status(201).json({ success: true, message: "Task created successfully", data: newTask });
  });
});

app.put("/api/tasks/:taskId", (req, res) => {
  const { taskId } = req.params;
  const taskData = req.body;
  if (!taskData.text && !taskData.assignedTo && !taskData.dueDate) { 
      return res.status(400).json({ message: 'No task data provided for update.' });
  }

  queries.updateTask(taskId, taskData, (err, success) => {
    if (err) {
      console.error(`Error updating task ${taskId}:`, err);
      return res.status(500).json({ success: false, message: "Failed to update task." });
    }
    if (!success) return res.status(404).json({ success: false, message: "Task not found or no change made." });
    return res.status(200).json({ success: true, message: "Task updated successfully." });
  });
});

app.delete("/api/tasks/:taskId", (req, res) => {
  const { taskId } = req.params;
  queries.deleteTask(taskId, (err, success) => {
    if (err) {
      console.error(`Error deleting task ${taskId}:`, err);
      return res.status(500).json({ success: false, message: "Failed to delete task." });
    }
    if (!success) return res.status(404).json({ success: false, message: "Task not found." });
    return res.status(200).json({ success: true, message: "Task deleted successfully." });
  });
});

// Update Routes
app.put("/api/boards/:boardId/lists/order", (req, res) => {
    const { boardId } = req.params;
    const { orderedListIds } = req.body; //
    if (!Array.isArray(orderedListIds)) {
        return res.status(400).json({ message: "orderedListIds must be an array." });
    }
    queries.updateListPositions(boardId, orderedListIds, (err, success) => {
        if (err) {
            console.error("Error updating list order:", err);
            return res.status(500).json({ success: false, message: "Failed to update list order." });
        }
        res.json({ success: true, message: "List order updated." });
    });
});

app.put("/api/lists/:listId/tasks/order", (req, res) => {
    const { listId } = req.params;
    const { orderedTaskIds, newParentListId } = req.body;
    
    const targetListId = newParentListId || listId;

    if (!Array.isArray(orderedTaskIds)) {
        return res.status(400).json({ message: "orderedTaskIds must be an array." });
    }
    queries.updateTaskPositionsInList(targetListId, orderedTaskIds, (err, success) => {
        if (err) {
            console.error("Error updating task order:", err);
            return res.status(500).json({ success: false, message: "Failed to update task order." });
        }
        res.json({ success: true, message: "Task order updated." });
    });
});



const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});