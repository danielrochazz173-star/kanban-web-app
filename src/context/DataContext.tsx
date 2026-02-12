import React, { useState, useContext, createContext, useEffect, useRef, useCallback } from "react";
import { Board, DataContextType } from "../data";
import data from "../data.json";
import { ActionTypeDatasReducer, datasReducer } from "../reducers/datasReducer";
import { useImmerReducer } from "use-immer";
import { apiJson, type BoardsResponse } from "../api";

function getBoardIdFromAction(action: ActionTypeDatasReducer): string | null {
  switch (action.type) {
    case "set_boards":
    case "set_board_from_server":
      return null;
    case "save_new_board":
      return null;
    case "edit_board":
      return action.board.id;
    case "delete_board":
      return action.idBoard;
    case "changed_status_subtask":
    case "changed_status_task":
    case "save_new_task":
    case "edit_task":
    case "delete_task":
    case "changed_status_task_and_add_new_position":
    case "changed_position_task":
      return action.idBoard;
    default:
      return null;
  }
}

const DataContext = React.createContext<DataContextType | null>(null);
const DataDispatchContext = createContext<React.Dispatch<ActionTypeDatasReducer> | null>(null);

export default function DataContextProvider({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem("token");
  const idBoardSelectedLocalStorage = localStorage.getItem("idBoardSelected");
  const [datas, baseDispatch] = useImmerReducer(
    datasReducer,
    token ? [] : (localStorage.getItem("datas") ? (JSON.parse(localStorage.getItem("datas")!) as Board[]) : data.boards)
  );
  const dirtyRef = useRef<Set<string>>(new Set());
  const [selectedIdBoard, setSelectedIdBoard] = useState<string>(
    idBoardSelectedLocalStorage || ""
  );
  const loadedRef = useRef(false);

  const dispatch = useCallback(
    (action: ActionTypeDatasReducer) => {
      const token = localStorage.getItem("token");
      if (token && action.type === "save_new_board") {
        apiJson<Board>("/boards", {
          method: "POST",
          body: JSON.stringify({ name: action.board.name, columns: action.board.columns }),
        })
          .then((board) => {
            baseDispatch({ type: "set_board_from_server", board });
            setSelectedIdBoard(board.id);
          })
          .catch(console.error);
        return;
      }
      if (token && action.type === "delete_board") {
        apiJson(`/boards/${action.idBoard}`, { method: "DELETE" })
          .then(() => baseDispatch(action))
          .catch(console.error);
        return;
      }
      baseDispatch(action);
      const id = getBoardIdFromAction(action);
      if (id) dirtyRef.current.add(id);
    },
    [baseDispatch]
  ) as React.Dispatch<ActionTypeDatasReducer>;

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await apiJson<BoardsResponse>("/boards");
        if (cancelled) return;
        loadedRef.current = true;
        baseDispatch({ type: "set_boards", boards: res.boards });
        if (res.boards.length > 0 && !idBoardSelectedLocalStorage) {
          setSelectedIdBoard((prev) => prev || res.boards[0].id);
        }
      } catch {
        if (!cancelled) loadedRef.current = true;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (!token) {
      localStorage.setItem("datas", JSON.stringify(datas));
    }
  }, [datas, token]);

  useEffect(() => {
    if (!token || !loadedRef.current) return;
    const toSync = Array.from(dirtyRef.current);
    dirtyRef.current.clear();
    toSync.forEach((id) => {
      const board = datas.find((b) => b.id === id);
      if (board) {
        apiJson(`/boards/${id}`, {
          method: "PUT",
          body: JSON.stringify(board),
        }).catch(console.error);
      }
    });
  }, [datas, token]);

  useEffect(() => {
    localStorage.setItem("idBoardSelected", selectedIdBoard);
  }, [selectedIdBoard]);

  useEffect(() => {
    if (datas.length > 0 && selectedIdBoard && !datas.find((b) => b.id === selectedIdBoard)) {
      setSelectedIdBoard(datas[0].id);
    }
  }, [datas, selectedIdBoard]);

  function updateIdSelectedBoard(idBoard: string) {
    setSelectedIdBoard(idBoard);
  }

  return (
    <DataContext.Provider value={{ datas, selectedIdBoard, updateIdSelectedBoard }}>
      <DataDispatchContext.Provider value={dispatch}>
        {children}
      </DataDispatchContext.Provider>
    </DataContext.Provider>
  );
}

export function useDataContext() {
  const dataContext = useContext(DataContext);
  if (!dataContext) throw new Error("Error in data context");
  return dataContext;
}

export function useDatasDispatch() {
  const dispatchContext = useContext(DataDispatchContext);
  if (!dispatchContext) throw new Error("Context dispatch datas error");
  return dispatchContext;
}
