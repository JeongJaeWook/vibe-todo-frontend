import { useState, useEffect } from 'react'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050/api/tasks';
const ITEMS_PER_PAGE = 10;

function App() {
  const [todos, setTodos] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

  const fetchTodos = async () => {
    try {
      const response = await fetch(API_URL);
      const result = await response.json();
      if (result.success) {
        setTodos(result.data);
      }
    } catch (error) {
      console.error('Error fetching todos:', error);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  const addTodo = async (e) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: inputValue, status: '대기' })
      });
      const result = await response.json();
      if (result.success) {
        setInputValue('');
        setCurrentPage(1); // 새로운 할 일 추가 시 첫 페이지로 이동
        fetchTodos();
      }
    } catch (error) {
      console.error('Error adding todo:', error);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      fetchTodos();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const updateText = async (id, newText) => {
    try {
      await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: newText })
      });
      fetchTodos();
    } catch (error) {
      console.error('Error updating text:', error);
    }
  };

  const requestDelete = (todo) => {
    setTaskToDelete(todo);
    setShowDeleteModal(true);
  };

  const deleteTodo = async () => {
    if (!taskToDelete) return;

    try {
      await fetch(`${API_URL}/${taskToDelete._id}`, { method: 'DELETE' });
      // 현재 페이지의 마지막 항목을 삭제하고 빈 페이지가 될 경우 이전 페이지로 이동
      if (currentTodos.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
      setShowDeleteModal(false);
      setTaskToDelete(null);
      fetchTodos();
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  // --- Pagination Logic ---
  const totalItems = todos.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const indexOfLastTodo = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstTodo = indexOfLastTodo - ITEMS_PER_PAGE;
  const currentTodos = todos.slice(indexOfFirstTodo, indexOfLastTodo);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const currentFullDate = new Date().toLocaleDateString('ko-KR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="app-wrapper">
      <div className="bg-blobs">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      <main className="app-container">
        <header>
          <p id="current-date">{currentFullDate}</p>
          <h1>My React Focus</h1>
        </header>

        <section className="input-section">
          <form className="input-group" onSubmit={addTodo}>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="할 일을 입력하세요..."
              autoComplete="off"
            />
            <button type="submit">
              <i className="fa-solid fa-plus"></i>
            </button>
          </form>
        </section>

        <section className="list-section">
          <ul className="todo-list">
            {currentTodos.map(todo => {
              const lastHistory = todo.statusHistory?.length > 0
                ? todo.statusHistory[todo.statusHistory.length - 1]
                : null;

              return (
                <li key={todo._id} className="todo-item" data-status={todo.status}>
                  <div className="status-wrapper">
                    <select
                      className="status-select"
                      value={todo.status}
                      onChange={(e) => updateStatus(todo._id, e.target.value)}
                    >
                      <option value="대기">대기</option>
                      <option value="진행중">진행중</option>
                      <option value="완료">완료</option>
                      <option value="미뤄짐">미뤄짐</option>
                    </select>
                  </div>

                  <div className="todo-main">
                    <div
                      className="todo-content"
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => {
                        const newText = e.target.innerText.trim();
                        if (newText && newText !== todo.task) {
                          updateText(todo._id, newText);
                        } else {
                          e.target.innerText = todo.task;
                        }
                      }}
                    >
                      {todo.task}
                    </div>
                    <div className="todo-meta">
                      <span className="todo-time">등록: {formatDate(todo.createdAt)}</span>
                      {lastHistory && (
                        <span className="status-history">
                          🕒 {lastHistory.from}➔{lastHistory.to} ({formatDate(lastHistory.updatedAt)})
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    className="action-btn delete-btn"
                    onClick={() => requestDelete(todo)}
                  >
                    <i className="fa-solid fa-trash-can"></i>
                  </button>
                </li>
              );
            })}
          </ul>

          {todos.length === 0 && (
            <div className="empty-state">
              <i className="fa-solid fa-wind" style={{ fontSize: '2rem', display: 'block', marginBottom: '10px' }}></i>
              <p>할 일이 없습니다.</p>
            </div>
          )}

          {/* Pagination UI */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="page-btn"
              >
                <i className="fa-solid fa-chevron-left"></i>
              </button>

              <div className="page-numbers">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => handlePageChange(i + 1)}
                    className={`page-num ${currentPage === i + 1 ? 'active' : ''}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="page-btn"
              >
                <i className="fa-solid fa-chevron-right"></i>
              </button>
            </div>
          )}
        </section>

        <footer>
          <span>{todos.filter(t => t.status !== '완료').length} tasks left</span>
          <button id="clear-all" onClick={() => fetchTodos()}>Refresh</button>
        </footer>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
            <h2>정말 삭제하시겠습니까?</h2>
            <p>"{taskToDelete?.task}" 항목이 영구히 삭제됩니다.</p>
            <div className="modal-actions">
              <button className="modal-btn cancel" onClick={() => setShowDeleteModal(false)}>취소</button>
              <button className="modal-btn confirm" onClick={deleteTodo}>삭제하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
