import * as iconv from "iconv-lite";
import csv from "neat-csv";
import { HTTPException } from "hono/http-exception";

interface scheduleDataType {
  id: number;
  room_id: string;
  day: string;
  start_time: string;
  end_time: string;
}

interface dataType {
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
  mid_day: string;
  mid_start_time: string;
  mid_end_time: string;
  final_day: string;
  final_start_time: string;
  final_end_time: string;
  problem: string[];
}

interface programDataType {
  id: number;
  name_th: string;
}

const scheduleProcessing = async (
  programData: programDataType[],
  scheduleData: scheduleDataType[],
  csvFiles: ArrayBuffer[]
) => {
  const scheduleIndexRoomId = new Map<string, scheduleDataType[]>();

  for (const row of scheduleData) {
    if (!scheduleIndexRoomId.has(row.room_id)) {
      scheduleIndexRoomId.set(row.room_id, []);
    }
    scheduleIndexRoomId.get(row.room_id)!.push(row);
  }

  const data: dataType[] = [];
  for (const f of csvFiles) {
    // let buffer = Buffer.from(await f.arrayBuffer());
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

      row.mid_day = convertFormat(item["17"]);

      row.mid_start_time = item["18"];
      row.mid_end_time = item["19"];

      row.final_day = convertFormat(item["21"]);

      row.final_start_time = item["22"];
      row.final_end_time = item["23"];

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

      // try {
      //   const [duplicateGroup] = await db
      //     .select({ id: schema.schedulesTable.id })
      //     .from(schema.schedulesTable)
      //     .where(
      //       and(
      //         and(
      //           eq(schema.schedulesTable.course_id, row.course_id),
      //           or(
      //             eq(schema.schedulesTable.group, row.group),
      //             eq(schema.schedulesTable.group, row.pair_group),
      //             eq(schema.schedulesTable.pair_group, row.pair_group),
      //             eq(schema.schedulesTable.pair_group, row.group)
      //           )
      //         )
      //       )
      //     )
      //     .limit(1);

      //   if (duplicateGroup) {
      //     row.problem.push(`duplicate group with id:${duplicateGroup.id}`);
      //   }
      // } catch (err) {
      //   console.log(err);
      // }
      const checkDuplicateTime = scheduleIndexRoomId.has(row.room_id)
        ? scheduleIndexRoomId.get(row.room_id)
        : [];
      for (const r of checkDuplicateTime!) {
        const condition =
          r.room_id === row.room_id &&
          r.day === row.day &&
          r.start_time < row.end_time &&
          r.end_time > row.start_time;

        if (condition) {
          row.problem.push(`duplicate time with id:${r.id}`);
          break;
        }
      }

      for (let j = 0; j < data.length; j++) {
        const condition2 =
          data[j].room_id === row.room_id &&
          data[j].day === row.day &&
          data[j].start_time < row.end_time &&
          data[j].end_time > row.start_time;

        if (condition2) {
          row.problem.push(`duplicate time with some row in excel`);
        }
      }

      data.push(row);
    }
  }

  return data;
};

export default scheduleProcessing;
