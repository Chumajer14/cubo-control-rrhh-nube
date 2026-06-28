import { markAttendance, listAttendance, todayAttendance, correctAttendance } from "../services/attendance.service.js";
import { attendanceCsv } from "../services/report.service.js";

export async function mark(req, res) {
  const result = await markAttendance({ ...req.body, req });
  res.status(201).json(result);
}

export async function list(req, res) {
  res.json(await listAttendance(req.query));
}

export async function today(req, res) {
  res.json(await todayAttendance());
}

export async function correct(req, res) {
  res.json(await correctAttendance(req.params.id, req.body, req.user, req));
}

export async function exportCsv(req, res) {
  const csv = await attendanceCsv(req.query, req.user, req);
  res.header("Content-Type", "text/csv; charset=utf-8");
  res.attachment("cubo-asistencia.csv");
  res.send(csv);
}
