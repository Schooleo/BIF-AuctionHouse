import { useAlertStore } from "@stores/useAlertStore";
import PopUpAlert from "@components/ui/PopUpAlert";

const AlertContainer: React.FC = () => {
  const { alerts, removeAlert } = useAlertStore();

  return (
    <div
      className="fixed bottom-4 right-4 z-9999 flex flex-col gap-3 pointer-events-none"
      aria-live="polite"
      aria-atomic="true"
    >
      {alerts.map((alert) => (
        <div key={alert.id} className="pointer-events-auto">
          <PopUpAlert
            id={alert.id}
            type={alert.type}
            message={alert.message}
            onClose={removeAlert}
          />
        </div>
      ))}
    </div>
  );
};

export default AlertContainer;
