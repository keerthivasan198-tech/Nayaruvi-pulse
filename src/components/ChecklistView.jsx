import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { db } from '../firebase';
import { ref, onValue, push, set, update, remove } from 'firebase/database';
import { Plus, GripVertical, Check, Trash2, ListTodo } from 'lucide-react';

export default function ChecklistView({ activeWorkspaceId, activeProjectId }) {
  const [items, setItems] = useState([]);
  const [newItemText, setNewItemText] = useState('');

  useEffect(() => {
    if (!activeProjectId) {
      setItems([]);
      return;
    }
    const listRef = ref(db, `dashboard_projects/${activeProjectId}/checklist`);
    const unsubscribe = onValue(listRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        list.sort((a, b) => a.order - b.order);
        setItems(list);
      } else {
        setItems([]);
      }
    });
    return () => unsubscribe();
  }, [activeProjectId]);

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    
    const itemsCopy = Array.from(items);
    const [reorderedItem] = itemsCopy.splice(result.source.index, 1);
    itemsCopy.splice(result.destination.index, 0, reorderedItem);

    // Update order optimistically
    setItems(itemsCopy);

    // Save to firebase
    try {
      const updates = {};
      itemsCopy.forEach((item, index) => {
        updates[`dashboard_projects/${activeProjectId}/checklist/${item.id}/order`] = index;
      });
      await update(ref(db), updates);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddItem = async (e) => {
    if (e.key === 'Enter' && newItemText.trim() && activeProjectId) {
      e.preventDefault();
      try {
        const itemRef = push(ref(db, `dashboard_projects/${activeProjectId}/checklist`));
        await set(itemRef, {
          text: newItemText.trim(),
          completed: false,
          order: items.length
        });
        setNewItemText('');
      } catch (err) {
        console.error(err);
      }
    }
  };

  const toggleItem = async (id, currentStatus) => {
    try {
      await update(ref(db, `dashboard_projects/${activeProjectId}/checklist/${id}`), {
        completed: !currentStatus
      });
    } catch (err) {
      console.error(err);
    }
  };

  const updateItemText = async (id, newText) => {
    if (!newText.trim()) return;
    try {
      await update(ref(db, `dashboard_projects/${activeProjectId}/checklist/${id}`), {
        text: newText.trim()
      });
    } catch (err) {
      console.error(err);
    }
  };

  const deleteItem = async (id) => {
    try {
      await remove(ref(db, `dashboard_projects/${activeProjectId}/checklist/${id}`));
    } catch (err) {
      console.error(err);
    }
  };

  const completedCount = items.filter(i => i.completed).length;
  const totalCount = items.length;
  const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  return (
    <div className="flex h-full w-full justify-center bg-[#DFD6AE] p-8 overflow-y-auto">
      <div className="w-full max-w-3xl flex flex-col">
        
        {/* Header */}
        <div className="mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[#274245] text-[#FAF7EC] flex items-center justify-center mb-4 shadow-md font-heading">
            <ListTodo size={24} strokeWidth={2} />
          </div>
          <h1 className="text-4xl font-normal text-[#274245] tracking-wide mb-1 font-heading uppercase">Workspace Checklist</h1>
          <p className="text-sm font-medium text-[#5C6E6F]">Keep track of important to-dos, quick notes, and team action items.</p>
        </div>
      {!activeProjectId ? (
        <div className="flex-1 flex items-center justify-center text-[#5C6E6F] font-medium">
          Please select a project from the sidebar to manage its checklist.
        </div>
      ) : (
        <>
          {/* Progress Bar */}
          <div className="mb-6 celestique-card p-4 rounded-2xl text-[#274245]">
            <div className="flex justify-between text-xs font-bold text-[#5C6E6F] mb-2">
              <span>{progress}% Completed</span>
              <span>{completedCount} / {totalCount} items</span>
            </div>
            <div className="h-2 w-full bg-[#E8E0BF] rounded-full overflow-hidden border border-[#D4C99E]">
              <div 
                className="h-full bg-[#274245] transition-all duration-500 ease-out" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

        {/* Checklist Card */}
        <div className="celestique-card rounded-2xl p-6 min-h-[400px] text-[#274245]">
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="checklist">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-1.5">
                  {items.map((item, index) => (
                    <Draggable key={item.id} draggableId={item.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`flex items-center group rounded-xl p-2.5 transition-all border ${
                            snapshot.isDragging ? 'bg-emerald-50/80 shadow-matte-lg border-emerald-300' : 'hover:bg-slate-50/80 border-transparent'
                          }`}
                        >
                          <div 
                            {...provided.dragHandleProps} 
                            className="p-1 mr-1 text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <GripVertical size={16} />
                          </div>
                          
                          <button 
                            onClick={() => toggleItem(item.id, item.completed)}
                            className={`w-5 h-5 flex-shrink-0 rounded-lg border flex items-center justify-center transition-all mr-3 cursor-pointer ${
                              item.completed 
                                ? 'bg-emerald-500 border-emerald-500 text-white shadow-2xs' 
                                : 'bg-white border-slate-300 hover:border-emerald-500'
                            }`}
                          >
                            {item.completed && <Check size={12} strokeWidth={3} />}
                          </button>
                          
                          <input 
                            type="text"
                            defaultValue={item.text}
                            onBlur={(e) => updateItemText(item.id, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') e.target.blur();
                            }}
                            className={`flex-1 bg-transparent text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 rounded-lg px-2 py-1 transition-all ${
                              item.completed ? 'text-slate-400 line-through' : 'text-slate-800 font-semibold'
                            }`}
                          />

                          <button 
                            onClick={() => deleteItem(item.id)}
                            className="ml-2 p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          {/* Add New Item Input */}
          <div className="flex items-center mt-4 pl-8 group pt-2 border-t border-slate-100">
            <Plus size={18} className="text-emerald-600 mr-3 shrink-0" />
            <input 
              type="text"
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              onKeyDown={handleAddItem}
              placeholder="Type a to-do and press Enter..."
              className="flex-1 bg-transparent text-sm font-semibold text-slate-800 focus:outline-none placeholder:text-slate-400 placeholder:font-medium"
            />
          </div>
        </div>
        </>
      )}
      </div>
    </div>
  );
}
