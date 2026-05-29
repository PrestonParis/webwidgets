'use client';

import { CalendarNotConnected } from '@/features/calendar/components/CalendarNotConnected';
import { EventFormModal } from '@/features/calendar/components/EventFormModal';
import { useCalendarPage } from '@/features/calendar/hooks/useCalendarPage';
import { useTodos } from '@/features/todo/hooks/useTodos';
import { PlanningTodayPanel } from '@/features/planning/components/PlanningTodayPanel';
import { PlanningCalendarGrid } from '@/features/planning/components/PlanningCalendarGrid';
import { PlanningAgendaPanel } from '@/features/planning/components/PlanningAgendaPanel';

export function PlanningPage() {
    const {
        today,
        viewYear,
        viewMonth,
        setViewYear,
        setViewMonth,
        selectedDate,
        setSelectedDate,
        formOpen,
        setFormOpen,
        editingEvent,
        loading,
        isNotConnected,
        refresh,
        grid,
        getDayEvents,
        prevMonth,
        nextMonth,
        openCreate,
        openEdit,
        handleDelete,
        selectedEvents,
        selectedLabel,
        createInitialData,
    } = useCalendarPage();

    const {
        todos,
        loading: todosLoading,
        addTodo,
        toggleTodo,
        deleteTodo,
    } = useTodos();

    if (isNotConnected) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
                <CalendarNotConnected />
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
            {/* Left: today date + tasks */}
            <div className="w-64 shrink-0">
                <PlanningTodayPanel
                    today={today}
                    todos={todos}
                    loading={todosLoading}
                    todayEventCount={getDayEvents(today).length}
                    onAddTodo={addTodo}
                    onToggleTodo={toggleTodo}
                    onDeleteTodo={deleteTodo}
                />
            </div>

            {/* Center: month calendar grid */}
            <div className="flex-1 min-w-0">
                <PlanningCalendarGrid
                    today={today}
                    viewYear={viewYear}
                    viewMonth={viewMonth}
                    setViewYear={setViewYear}
                    setViewMonth={setViewMonth}
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                    grid={grid}
                    getDayEvents={getDayEvents}
                    prevMonth={prevMonth}
                    nextMonth={nextMonth}
                    loading={loading}
                    onNewEvent={openCreate}
                />
            </div>

            {/* Right: agenda for selected day + upcoming week */}
            <div className="w-80 shrink-0 border-l border-zinc-200 dark:border-zinc-800">
                <PlanningAgendaPanel
                    selectedLabel={selectedLabel}
                    selectedEvents={selectedEvents}
                    today={today}
                    getDayEvents={getDayEvents}
                    onAddEvent={openCreate}
                    onEditEvent={openEdit}
                    onDeleteEvent={handleDelete}
                    onSelectDate={setSelectedDate}
                />
            </div>

            <EventFormModal
                open={formOpen}
                onClose={() => setFormOpen(false)}
                onSaved={refresh}
                editEvent={editingEvent}
                initialData={editingEvent ? undefined : createInitialData}
            />
        </div>
    );
}
