import React, { useState, useEffect } from "react";
import { useAuthStore } from "../auth/authStore";

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  platform: string;
  status: "draft" | "scheduled" | "published" | "failed";
  type: "post" | "story" | "reel" | "tweet" | "email" | "blog";
}

const ContentCalendar: React.FC = () => {
  const { user } = useAuthStore();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    date: "",
    platform: "instagram",
    type: "post" as const,
  });

  const platforms = [
    "instagram",
    "facebook",
    "twitter",
    "linkedin",
    "tiktok",
    "youtube",
    "blog",
    "email",
  ];

  const contentTypes = [
    "post",
    "story",
    "reel",
    "tweet",
    "video",
    "blog",
    "email",
    "infographic",
  ];

  useEffect(() => {
    // Load events from API
    loadEvents();
  }, [currentDate]);

  const loadEvents = async () => {
    // Mock data for now
    const mockEvents: CalendarEvent[] = [
      {
        id: "1",
        title: "Product Launch Post",
        description: "Announcing our new feature launch",
        date: "2024-01-15",
        platform: "instagram",
        status: "scheduled",
        type: "post",
      },
      {
        id: "2",
        title: "Customer Success Story",
        description: "Share how our product helped a customer",
        date: "2024-01-18",
        platform: "linkedin",
        status: "draft",
        type: "post",
      },
    ];
    setEvents(mockEvents);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return events.filter((event) => event.date === dateStr);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setShowEventForm(true);
    setNewEvent((prev) => ({
      ...prev,
      date: date.toISOString().split("T")[0],
    }));
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Here you would call your API to create the event
      const event: CalendarEvent = {
        id: Date.now().toString(),
        ...newEvent,
        status: "draft",
      };

      setEvents([...events, event]);
      setShowEventForm(false);
      setNewEvent({
        title: "",
        description: "",
        date: "",
        platform: "instagram",
        type: "post",
      });
    } catch (error) {
      console.error("Error creating event:", error);
    }
  };

  const updateEventStatus = async (
    eventId: string,
    status: CalendarEvent["status"],
  ) => {
    setEvents(
      events.map((event) =>
        event.id === eventId ? { ...event, status } : event,
      ),
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "#6c757d";
      case "scheduled":
        return "#007bff";
      case "published":
        return "#28a745";
      case "failed":
        return "#dc3545";
      default:
        return "#6c757d";
    }
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const days = getDaysInMonth(currentDate);
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  return (
    <div className="content-calendar">
      <div className="calendar-header">
        <h1>📅 Content Calendar</h1>
        <p>Plan and schedule your marketing content across all platforms</p>

        <div className="calendar-controls">
          <button className="btn-nav" onClick={() => navigateMonth("prev")}>
            ‹ Prev
          </button>
          <h2>
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button className="btn-nav" onClick={() => navigateMonth("next")}>
            Next ›
          </button>
        </div>
      </div>

      <div className="calendar-grid">
        {/* Day headers */}
        <div className="day-headers">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="day-header">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="days-grid">
          {days.map((date, index) => (
            <div
              key={index}
              className={`calendar-day ${date ? "has-date" : "empty"}`}
              onClick={() => date && handleDateClick(date)}
            >
              {date && (
                <>
                  <div className="day-number">{date.getDate()}</div>
                  <div className="day-events">
                    {getEventsForDate(date).map((event) => (
                      <div
                        key={event.id}
                        className="event-item"
                        style={{
                          backgroundColor: getStatusColor(event.status),
                        }}
                        title={`${event.title} - ${event.platform}`}
                      >
                        <span className="event-platform">
                          {event.platform.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Event Form Modal */}
      {showEventForm && (
        <div className="modal-overlay" onClick={() => setShowEventForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Content Event</h3>
              <button
                className="close-btn"
                onClick={() => setShowEventForm(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateEvent}>
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, title: e.target.value })
                  }
                  required
                  placeholder="e.g., Product Launch Announcement"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, description: e.target.value })
                  }
                  placeholder="Content details and notes..."
                  rows={3}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Platform</label>
                  <select
                    value={newEvent.platform}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, platform: e.target.value })
                    }
                  >
                    {platforms.map((platform) => (
                      <option key={platform} value={platform}>
                        {platform.charAt(0).toUpperCase() + platform.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Content Type</label>
                  <select
                    value={newEvent.type}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, type: e.target.value as any })
                    }
                  >
                    {contentTypes.map((type) => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  value={newEvent.date}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, date: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => setShowEventForm(false)}
                  className="btn-cancel"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Events List Sidebar */}
      <div className="events-sidebar">
        <h3>Upcoming Events</h3>
        <div className="events-list">
          {events
            .filter((event) => new Date(event.date) >= new Date())
            .sort(
              (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
            )
            .slice(0, 10)
            .map((event) => (
              <div key={event.id} className="event-summary">
                <div className="event-summary-header">
                  <h4>{event.title}</h4>
                  <span
                    className="status-dot"
                    style={{ backgroundColor: getStatusColor(event.status) }}
                  />
                </div>
                <div className="event-summary-meta">
                  <span className="platform">{event.platform}</span>
                  <span className="date">
                    {new Date(event.date).toLocaleDateString()}
                  </span>
                </div>
                <div className="event-actions">
                  <button
                    onClick={() => updateEventStatus(event.id, "scheduled")}
                    className="btn-small"
                  >
                    Schedule
                  </button>
                  <button
                    onClick={() => updateEventStatus(event.id, "published")}
                    className="btn-small"
                  >
                    Mark Published
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>

      <style jsx>{`
        .content-calendar {
          padding: 2rem;
          max-width: 1400px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 2rem;
        }

        .calendar-header {
          grid-column: 1 / -1;
          text-align: center;
          margin-bottom: 2rem;
        }

        .calendar-header h1 {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
        }

        .calendar-controls {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 2rem;
          margin-top: 2rem;
        }

        .calendar-controls h2 {
          margin: 0;
          font-size: 1.5rem;
        }

        .btn-nav {
          background: var(--primary);
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
        }

        .calendar-grid {
          background: white;
          border-radius: 12px;
          border: 1px solid var(--border);
          overflow: hidden;
        }

        .day-headers {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          background: var(--light-bg);
          border-bottom: 1px solid var(--border);
        }

        .day-header {
          padding: 1rem;
          text-align: center;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .days-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
        }

        .calendar-day {
          min-height: 120px;
          padding: 0.5rem;
          border-right: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .calendar-day:hover {
          background: var(--light-bg);
        }

        .calendar-day.has-date {
          position: relative;
        }

        .day-number {
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: var(--text-primary);
        }

        .day-events {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .event-item {
          height: 16px;
          border-radius: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.7rem;
          color: white;
          font-weight: 600;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          padding: 0;
          max-width: 500px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid var(--border);
        }

        .modal-header h3 {
          margin: 0;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: var(--text-secondary);
        }

        .form-group {
          margin-bottom: 1.5rem;
          padding: 0 1.5rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid var(--border);
          border-radius: 6px;
          font-size: 1rem;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .form-actions {
          padding: 1.5rem;
          border-top: 1px solid var(--border);
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
        }

        .btn-cancel {
          background: var(--secondary);
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          cursor: pointer;
        }

        .btn-primary {
          background: var(--primary);
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          cursor: pointer;
        }

        .events-sidebar {
          background: white;
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 1.5rem;
        }

        .events-sidebar h3 {
          margin-top: 0;
          margin-bottom: 1rem;
          color: var(--text-primary);
        }

        .events-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .event-summary {
          padding: 1rem;
          border: 1px solid var(--border);
          border-radius: 8px;
        }

        .event-summary-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.5rem;
        }

        .event-summary-header h4 {
          margin: 0;
          font-size: 1rem;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .event-summary-meta {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
          color: var(--text-secondary);
          margin-bottom: 0.5rem;
        }

        .event-actions {
          display: flex;
          gap: 0.5rem;
        }

        .btn-small {
          padding: 0.25rem 0.5rem;
          font-size: 0.8rem;
          border: 1px solid var(--primary);
          background: white;
          color: var(--primary);
          border-radius: 4px;
          cursor: pointer;
        }

        @media (max-width: 768px) {
          .content-calendar {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .events-sidebar {
            order: -1;
          }
        }
      `}</style>
    </div>
  );
};

export default ContentCalendar;
