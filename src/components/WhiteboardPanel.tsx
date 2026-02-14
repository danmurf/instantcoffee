/**
 * WhiteboardPanel - Diagram display area
 * 
 * Placeholder for now. Full implementation coming in 01-03-PLAN.md
 * when D2 rendering pipeline is implemented.
 */

export function WhiteboardPanel() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mb-4 text-6xl">📋</div>
        <h3 className="mb-2 text-lg font-medium text-gray-900">
          Whiteboard
        </h3>
        <p className="max-w-xs text-sm text-gray-500">
          Your diagram will appear here once you send a message.
        </p>
      </div>
    </div>
  );
}
