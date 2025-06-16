const db = require("./db");


function createBoard(boardName, callback) {
  const query = `INSERT INTO boards (boardName) VALUES (?)`;
  db.query(query, [boardName], (err, result) => {
    if (err) return callback(err);
    callback(null, { id: result.insertId, name: boardName });
  });
}

function getAllBoards(callback) {
 
  const query = `SELECT board_id, boardName FROM boards ORDER BY boardName ASC`;
  db.query(query, (err, results) => {
    if (err) return callback(err);
    callback(null, results);
  });
}

function getBoardByIdWithDetails(boardId, callback) {
  let boardData = {};
  const boardQuery = `SELECT board_id, boardName FROM boards WHERE board_id = ?`;

  db.query(boardQuery, [boardId], (err, boardResults) => {
    if (err) return callback(err);
    if (boardResults.length === 0) return callback(new Error("Board not found"));
    
    boardData = { ...boardResults[0] }; 

    const listsQuery = `
      SELECT list_id, listName 
      FROM lists 
      WHERE board_id = ? 
      ORDER BY list_order ASC, list_id ASC
    `;
    db.query(listsQuery, [boardId], (err, listResults) => {
      if (err) return callback(err);
      
      boardData.lists = listResults.map(list => ({ ...list, tasks: [] }));

      if (listResults.length === 0) {
        return callback(null, boardData);
      }

      const listIds = listResults.map(l => l.list_id);
      const tasksQuery = `
        SELECT task_id, list_id, taskName, assignedTo, dueDate 
        FROM tasks 
        WHERE list_id IN (?) 
        ORDER BY task_order ASC, task_id ASC
      `;
      
      if (listIds.length === 0) {
          return callback(null, boardData);
      }

      db.query(tasksQuery, [listIds], (err, taskResults) => {
        if (err) return callback(err);
        
        taskResults.forEach(taskRow => {
          const task = { ...taskRow };
          const list = boardData.lists.find(l => l.list_id === task.list_id);
          if (list) {
            list.tasks.push(task);
          }
        });
        callback(null, boardData);
      });
    });
  });
}


function updateBoardName(boardId, newName, callback) {
  const query = `UPDATE boards SET boardName = ? WHERE board_id = ?`;
  db.query(query, [newName, boardId], (err, result) => {
    if (err) return callback(err);
    callback(null, result.affectedRows > 0);
  });
}

function deleteBoard(boardId, callback) {

  const query = `DELETE FROM boards WHERE board_id = ?`;
  db.query(query, [boardId], (err, result) => {
    if (err) return callback(err);
    callback(null, result.affectedRows > 0);
  });
}

//Lists
function createList(boardId, listName, callback) {
  
  const orderQuery = `SELECT COALESCE(MAX(list_order), -1) + 1 AS next_order FROM lists WHERE board_id = ?`;
  db.query(orderQuery, [boardId], (err, orderResult) => {
    if (err) return callback(err);
    const nextOrder = orderResult[0].next_order;

    const query = `INSERT INTO lists (board_id, listName, list_order) VALUES (?, ?, ?)`;
    db.query(query, [boardId, listName, nextOrder], (err, result) => {
      if (err) return callback(err);
      callback(null, { list_id: result.insertId, listName, board_id: parseInt(boardId), tasks: [] });
    });
  });
}

function updateListName(listId, newName, callback) {
  const query = `UPDATE lists SET listName = ? WHERE list_id = ?`;
  db.query(query, [newName, listId], (err, result) => {
    if (err) return callback(err);
    callback(null, result.affectedRows > 0);
  });
}

function deleteList(listId, callback) {
  const query = `DELETE FROM lists WHERE list_id = ?`;
  db.query(query, [listId], (err, result) => {
    if (err) return callback(err);
    callback(null, result.affectedRows > 0);
  });
}

//Tasks 
function createTask(listId, taskData, callback) {
  const { text, assignedTo, dueDate } = taskData;
  const orderQuery = `SELECT COALESCE(MAX(task_order), -1) + 1 AS next_order FROM tasks WHERE list_id = ?`;
  db.query(orderQuery, [listId], (err, orderResult) => {
    if (err) return callback(err);
    const nextOrder = orderResult[0].next_order;

    const query = `INSERT INTO tasks (list_id, taskName, assignedTo, dueDate, task_order) VALUES (?, ?, ?, ?, ?)`;
    db.query(query, [listId, text, assignedTo || null, dueDate || null, nextOrder], (err, result) => {
      if (err) return callback(err);
      callback(null, { task_id: result.insertId, list_id: parseInt(listId), taskName: text, assignedTo, dueDate });
    });
  });
}

function updateTask(taskId, taskData, callback) {
  const { text, assignedTo, dueDate } = taskData;
  const query = `UPDATE tasks SET taskName = ?, assignedTo = ?, dueDate = ? WHERE task_id = ?`;
  db.query(query, [text, assignedTo || null, dueDate || null, taskId], (err, result) => {
    if (err) return callback(err);
    callback(null, result.affectedRows > 0);
  });
}

function deleteTask(taskId, callback) {
  const query = `DELETE FROM tasks WHERE task_id = ?`;
  db.query(query, [taskId], (err, result) => {
    if (err) return callback(err);
    callback(null, result.affectedRows > 0);
  });
}


async function updateTaskPosition(taskId, newListId, newOrder, callback) {

  const query = `UPDATE tasks SET list_id = ?, task_order = ? WHERE task_id = ?`;
  db.query(query, [newListId, newOrder, taskId], (err, result) => {
      if (err) return callback(err);
   
      callback(null, result.affectedRows > 0);
  });
}

async function updateListPositions(boardId, orderedListIds, callback) {
  const promises = orderedListIds.map((listId, index) => {
    return new Promise((resolve, reject) => {
      const query = `UPDATE lists SET list_order = ? WHERE list_id = ? AND board_id = ?`;
      db.query(query, [index, listId, boardId], (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  });
  try {
    await Promise.all(promises);
    callback(null, true);
  } catch (err) {
    callback(err);
  }
}

async function updateTaskPositionsInList(listId, orderedTaskIds, callback) {
  const promises = orderedTaskIds.map((taskId, index) => {
    return new Promise((resolve, reject) => {
      const query = `UPDATE tasks SET task_order = ?, list_id = ? WHERE task_id = ?`;
      db.query(query, [index, listId, taskId], (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  });
  try {
    await Promise.all(promises);
    callback(null, true);
  } catch (err) {
    callback(err);
  }
}


module.exports = {
  createBoard,
  getAllBoards,
  getBoardByIdWithDetails,
  updateBoardName,
  deleteBoard,
  createList,
  updateListName,
  deleteList,
  createTask,
  updateTask,
  deleteTask,
  updateTaskPosition,
  updateListPositions,
  updateTaskPositionsInList 
};