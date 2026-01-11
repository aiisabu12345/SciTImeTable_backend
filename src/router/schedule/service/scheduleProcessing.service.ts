import iconv from "iconv-lite";
import csv from "neat-csv";
import { HTTPException } from "hono/http-exception";
import mapScheduleWithRoomId from "./mapScheduleWithRoomId.service.js";
import type {
  scheduleDataType,
  dataType,
  programDataType,
} from "../types/schedulesTypes.js";

const scheduleProcessing = async (
  programData: programDataType[],
  scheduleData: scheduleDataType[],
  csvFiles: ArrayBuffer[]
) => {
  //map scheduleData with room id
  const scheduleIndexRoomId = await mapScheduleWithRoomId(scheduleData);

  const data: dataType[] = [];
  for (const f of csvFiles) {
    let raw = (iconv as any).decode(f, "utf-8");

    raw = raw.replace(/^\uFEFF/, "");

    let result = await csv(raw, { headers: false });

    if (Object.keys(result[0]).length !== 29) {
      throw new HTTPException(400, { message: "wrong column" });
    }

    //check duplicate room,day,time
    result.shift();

    for (const item of result) {
      const row: dataType = {
        course_id: "",
        program_id: 0,
        type: "",
        group: 0,
        pair_group: 0,
        student_count: 0,
        lecturer: "",
        day: "",
        start_time: "",
        end_time: "",
        room_id: "",
        mid_day: "",
        mid_start_time: "",
        mid_end_time: "",
        final_day: "",
        final_start_time: "",
        final_end_time: "",
        problem: [],
      };

      row.course_id = item["0"];
      if (!row.course_id) {
        continue;
      }

      const index_programData = programData.findIndex(
        (p) => p.name_th === item["3"]
      );
      if (index_programData >= 0) {
        row.program_id = programData[index_programData].id;
      }

      row.type = item["5"];
      row.group = Number(item["6"]);
      row.pair_group = Number(item["7"]);
      row.student_count = Number(item["8"]);
      row.lecturer = item["9"];
      row.day = item["10"];
      row.start_time = item["11"];
      row.end_time = item["12"];
      row.room_id = item["13"] + item["15"];

      const convertFormat = (dateString: string) => {
        const dateStringArg = dateString.split("/");
        dateStringArg.map((item) => item.trim());
        return (
          String(Number(dateStringArg[2]) - 543) +
          "-" +
          dateStringArg[1] +
          "-" +
          dateStringArg[0]
        );
      };

      // mid and final can be null
      row.mid_start_time = item["18"];
      row.mid_end_time = item["19"];

      row.mid_day = convertFormat(item["17"]);
      // if (row.mid_day === "") {
      //   row.mid_day = null;
      //   row.mid_start_time = null;
      //   row.mid_end_time = null;
      // }

      row.final_start_time = item["22"];
      row.final_end_time = item["23"];

      row.final_day = convertFormat(item["21"]);
      // if (row.final_day === "") {
      //   row.final_day = null;
      //   row.final_start_time = null;
      //   row.final_end_time = null;
      // }
      // try {
      //   const [duplicateTime] = await db
      //     .select({ id: schema.schedulesTable.id })
      //     .from(schema.schedulesTable)
      //     .where(
      //       and(
      //         eq(schema.schedulesTable.day, row.day),
      //         eq(schema.schedulesTable.room_id, row.room_id),
      //         and(
      //           lt(schema.schedulesTable.start_time, row.end_time),
      //           gt(schema.schedulesTable.end_time, row.start_time)
      //         )
      //       )
      //     )
      //     .limit(1);

      //   if (duplicateTime) {
      //     row.problem.push(`duplicate time with id:${duplicateTime.id}`);
      //   }
      // } catch (err) {
      //   console.log(err);
      // }
      const checkDuplicateTime = scheduleIndexRoomId.has(row.room_id)
        ? scheduleIndexRoomId.get(row.room_id)
        : [];
      for (const r of checkDuplicateTime!) {
        const condition1 =
          r.room_id === row.room_id &&
          r.day === row.day &&
          r.start_time < row.end_time &&
          r.end_time > row.start_time;

        if (condition1) {
          if (r.id < 0) {
            row.problem.push(`duplicate time with some row in excel`);
          } else {
            row.problem.push(`duplicate time with id:${r.id}`);
          }
          break;
        }
      }

      const thisSchedule: scheduleDataType = {
        id: -1,
        room_id: "",
        day: "",
        start_time: "",
        end_time: "",
      };

      thisSchedule.room_id = row.room_id;
      thisSchedule.day = row.day;
      thisSchedule.start_time = row.start_time;
      thisSchedule.end_time = row.end_time;

      if (!scheduleIndexRoomId.has(row.room_id)) {
        scheduleIndexRoomId.set(row.room_id, []);
      }
      scheduleIndexRoomId.get(row.room_id)!.push(thisSchedule);

      // for (let j = 0; j < data.length; j++) {
      //   const condition2 =
      //     data[j].room_id === row.room_id &&
      //     data[j].day === row.day &&
      //     data[j].start_time < row.end_time &&
      //     data[j].end_time > row.start_time;

      //   if (condition2) {
      //     row.problem.push(`duplicate time with some row in excel`);
      //   }
      // }

      data.push(row);
    }
  }

  return data;
};

export default scheduleProcessing;
