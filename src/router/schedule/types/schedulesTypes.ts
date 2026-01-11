export interface scheduleDataType {
  id: number;
  room_id: string;
  day: string;
  start_time: string;
  end_time: string;
}

export interface dataType {
  course_id: string;
  program_id: number;
  type: string;
  group: number;
  pair_group: number;
  student_count: number;
  lecturer: string;
  day: string;
  start_time: string;
  end_time: string;
  room_id: string;
  mid_day: string | null;
  mid_start_time: string | null;
  mid_end_time: string | null;
  final_day: string | null;
  final_start_time: string | null;
  final_end_time: string | null;
  problem: string[];
}

export interface programDataType {
  id: number;
  name_th: string;
}