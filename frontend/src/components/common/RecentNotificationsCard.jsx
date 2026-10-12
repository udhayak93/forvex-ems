import React, { useState } from 'react';
import { Cake, Calendar, Banknote, UserPlus, Bell, Check } from 'lucide-react';

export const RecentNotificationsCard = ({
  title = 'Recent Notifications',
  notifications = [],
  onLoadMore,
}) => {
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const [items, setItems] = useState(
    notifications && notifications.length > 0
      ? notifications
      : [
          {
            id: 'notif-1',
            title: 'Employee Birthday',
            description: "Today is Sarah Connor's birthday. Don't forget to send a wish!",
            type: 'birthday',
            timeAgo: '2 hours ago',
            unread: true,
          },
          {
            id: 'notif-2',
            title: 'Leave Request',
            description: 'Marcus Wright requested 3 days of medical leave starting Monday.',
            type: 'leave',
            timeAgo: '5 hours ago',
            unread: true,
          },
          {
            id: 'notif-3',
            title: 'Salary Processed',
            description: 'Payroll for the month of October has been successfully distributed to 1,284 employees.',
            type: 'payroll',
            timeAgo: 'Yesterday',
            unread: false,
          },
          {
            id: 'notif-4',
            title: 'New Onboarding',
            description: 'John Reese joined as Senior Security Engineer in the Ops department.',
            type: 'onboarding',
            timeAgo: '2 days ago',
            unread: false,
          },
        ]
  );

  const getIconConfig = (type) => {
    switch (type) {
      case 'birthday':
        return {
          icon: Cake,
          bgColor: '#fef3c7',
          color: '#d97706',
        };
      case 'leave':
        return {
          icon: Calendar,
          bgColor: '#fee2e2',
          color: '#dc2626',
        };
      case 'payroll':
        return {
          icon: Banknote,
          bgColor: '#d1fae5',
          color: '#059669',
        };
      case 'onboarding':
      default:
        return {
          icon: UserPlus,
          bgColor: '#e0e7ff',
          color: '#4f46e5',
        };
    }
  };

  const filteredItems = filter === 'unread' ? items.filter((i) => i.unread) : items;

  const markAllRead = () => {
    setItems(items.map((i) => ({ ...i, unread: false })));
  };

  return (
    <div className="nexus-card p-4 h-100 d-flex flex-column justify-content-between">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
          <Bell size={18} className="text-primary" />
          <span>{title}</span>
        </h6>

        <div className="btn-group btn-group-sm bg-light p-1 rounded-3 border">
          <button
            type="button"
            className={`btn btn-sm py-1 px-3 ${filter === 'all' ? 'btn-primary fw-semibold' : 'btn-light text-muted'}`}
            style={{ fontSize: '0.75rem', borderRadius: 6 }}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            type="button"
            className={`btn btn-sm py-1 px-3 ${filter === 'unread' ? 'btn-primary fw-semibold' : 'btn-light text-muted'}`}
            style={{ fontSize: '0.75rem', borderRadius: 6 }}
            onClick={() => setFilter('unread')}
          >
            Unread
          </button>
        </div>
      </div>

      {/* Notification Items List */}
      <div className="d-flex flex-column gap-3 my-2">
        {filteredItems.length === 0 ? (
          <div className="text-muted text-center py-4 small">
            No unread notifications at this time.
          </div>
        ) : (
          filteredItems.map((item) => {
            const { icon: ItemIcon, bgColor, color } = getIconConfig(item.type);
            return (
              <div
                key={item.id}
                className="d-flex align-items-start gap-3 p-2 rounded-3 hover-bg transition-all"
                style={{
                  backgroundColor: item.unread ? 'rgba(79, 70, 229, 0.03)' : 'transparent',
                }}
              >
                {/* Circular Icon Badge */}
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{
                    width: 42,
                    height: 42,
                    backgroundColor: bgColor,
                    color: color,
                  }}
                >
                  <ItemIcon size={19} />
                </div>

                {/* Details */}
                <div className="flex-grow-1 min-width-0">
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="fw-bold text-dark small">{item.title}</span>
                    <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
                      {item.timeAgo}
                    </span>
                  </div>
                  <p className="text-muted small mb-0 mt-1 line-clamp-2" style={{ fontSize: '0.82rem' }}>
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Button matching reference image */}
      <div className="text-center pt-3 mt-2 border-top">
        <button
          type="button"
          className="btn btn-link text-decoration-none text-muted fw-bold small p-0 hover-primary"
          style={{ fontSize: '0.76rem', letterSpacing: '0.04em' }}
          onClick={markAllRead}
        >
          LOAD ALL NOTIFICATIONS
        </button>
      </div>
    </div>
  );
};
