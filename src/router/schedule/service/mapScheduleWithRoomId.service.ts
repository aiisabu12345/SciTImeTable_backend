import type { scheduleDataType } from "../types/schedulesTypes.js";

const mapScheduleWithRoomId = async (scheduleData: scheduleDataType[]) => {
  const scheduleIndexRoomId = new Map<string, scheduleDataType[]>();

  for (const row of scheduleData) {
    if (!scheduleIndexRoomId.has(row.room_id)) {
      scheduleIndexRoomId.set(row.room_id, []);
    }
    scheduleIndexRoomId.get(row.room_id)!.push(row);
  }
  return scheduleIndexRoomId;
};

export default mapScheduleWithRoomId;