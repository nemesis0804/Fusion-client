/* eslint-disable react/prop-types */
/* eslint-disable no-restricted-globals */
/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable no-unused-vars */
import React, { useRef, useState } from "react";
import {
  Modal,
  Button,
  Stack,
  Text,
  Paper,
  Box,
  Group,
  SegmentedControl,
  Tooltip,
} from "@mantine/core";
import { Printer, Layout, Columns, Newspaper } from "phosphor-react";
import generatePDF from "react-to-pdf";

/* ═══════════════════════════════════════════════
   SHARED HELPERS
═══════════════════════════════════════════════ */
function formatDate(d) {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt)) return d;
  return dt.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

function dateRange(sdate, edate, status) {
  const start = formatDate(sdate);
  const end = edate ? formatDate(edate) : status === "ONGOING" ? "Present" : "";
  if (!start && !end) return "";
  if (!end) return start;
  return `${start} – ${end}`;
}

function splitBullets(text) {
  if (!text) return [];
  return text
    .split(/\n|•|\r/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function chunkArray(arr, size) {
  const result = [];
  for (let i = 0; i < arr.length; i += size)
    result.push(arr.slice(i, i + size));
  return result;
}

function extractCvFields(cvData) {
  const {
    user = {},
    profile = {},
    student = {},
    skills = [],
    education = [],
    experiences = [],
    projects = [],
    achievements = [],
    extracurriculars = [],
    courses = [],
    publications = [],
    patents = [],
    references = [],
  } = cvData || {};

  return {
    fullName:
      [user.first_name, user.last_name].filter(Boolean).join(" ") ||
      "Your Name",
    email: user.email || "",
    phone: profile.phone_no || "",
    dept: profile.department || "",
    prog: student.programme || "",
    cpi: student.cpi != null ? student.cpi : "",
    batch: student.batch || "",
    linkedin: cvData?.linkedin_url || "",
    github: cvData?.github_url || "",
    portfolio: cvData?.portfolio_url || "",
    aboutMe: profile.about_me || cvData?.about_me || "",
    skillNames: skills
      .map((s) => s.skill_id?.skill || s.skill || "")
      .filter(Boolean),
    education,
    experiences,
    projects,
    achievements,
    extracurriculars,
    courses,
    publications,
    patents,
    references,
  };
}

/* ═══════════════════════════════════════════════
   TEMPLATE 1 — "Classic" (Jake / ATS black & white)
═══════════════════════════════════════════════ */
const T1 = {
  page: {
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    fontSize: "10.5pt",
    color: "#000",
    backgroundColor: "#fff",
    width: "210mm",
    minHeight: "297mm",
    padding: "14mm 14mm 12mm 14mm",
    boxSizing: "border-box",
    lineHeight: 1.35,
  },
  name: {
    fontSize: "22pt",
    fontWeight: "700",
    letterSpacing: "0.03em",
    textAlign: "center",
    marginBottom: "3px",
  },
  contactRow: {
    display: "flex",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: "4px 12px",
    fontSize: "9.5pt",
    color: "#333",
    marginBottom: "2px",
  },
  sep: { color: "#999" },
  link: { color: "#1a0dab", textDecoration: "none" },
  sectionTitle: {
    fontSize: "10.5pt",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    borderBottom: "1.5px solid #000",
    paddingBottom: "2px",
    marginTop: "11px",
    marginBottom: "6px",
  },
  eduRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "6px",
  },
  bold: { fontWeight: "700" },
  muted: { color: "#555", fontSize: "9.5pt" },
  right: {
    textAlign: "right",
    whiteSpace: "nowrap",
    marginLeft: "8px",
    flexShrink: 0,
  },
  entryHdr: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  bullet: {
    marginLeft: "14px",
    paddingLeft: "0",
    marginTop: "3px",
    marginBottom: "0",
    listStyleType: "disc",
  },
  bulletLi: { marginBottom: "2px", fontSize: "9.8pt" },
  block: { marginBottom: "9px" },
  skillLine: { marginBottom: "3px", fontSize: "9.8pt" },
  listItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "3px",
    fontSize: "9.8pt",
  },
};

function T1Section({ title, children }) {
  return (
    <div>
      <div style={T1.sectionTitle}>{title}</div>
      {children}
    </div>
  );
}

function Template1({ data, targetRef }) {
  const {
    fullName,
    email,
    phone,
    dept,
    prog,
    cpi,
    batch,
    linkedin,
    github,
    portfolio,
    aboutMe,
    skillNames,
    education,
    experiences,
    projects,
    achievements,
    extracurriculars,
    courses,
    publications,
    patents,
    references,
  } = data;

  function Pipe() {
    return <span style={T1.sep}> | </span>;
  }

  return (
    <div ref={targetRef} style={T1.page}>
      <div style={T1.name}>{fullName}</div>
      <div style={T1.contactRow}>
        {phone}
        {phone && email && <Pipe />}
        {email && (
          <a href={`mailto:${email}`} style={T1.link}>
            {email}
          </a>
        )}
        {(phone || email) && (linkedin || github || portfolio) && <Pipe />}
        {linkedin && (
          <a href={linkedin} style={T1.link} target="_blank" rel="noreferrer">
            LinkedIn
          </a>
        )}
        {linkedin && github && <Pipe />}
        {github && (
          <a href={github} style={T1.link} target="_blank" rel="noreferrer">
            GitHub
          </a>
        )}
        {github && portfolio && <Pipe />}
        {portfolio && (
          <a href={portfolio} style={T1.link} target="_blank" rel="noreferrer">
            Portfolio
          </a>
        )}
      </div>
      {(prog || dept || cpi !== "") && (
        <div style={{ ...T1.contactRow, marginTop: "1px" }}>
          {prog}
          {prog && dept && <Pipe />}
          {dept}
          {(prog || dept) && cpi !== "" && <Pipe />}
          {cpi !== "" && (
            <span>
              CPI: <strong>{cpi}</strong>
            </span>
          )}
          {cpi !== "" && batch && <Pipe />}
          {batch && <span>Batch {batch}</span>}
        </div>
      )}

      {aboutMe && (
        <T1Section title="Objective">
          <p style={{ margin: "0 0 4px", fontSize: "9.8pt" }}>{aboutMe}</p>
        </T1Section>
      )}

      {education.length > 0 && (
        <T1Section title="Education">
          {education.map((edu, i) => (
            <div key={i} style={T1.eduRow}>
              <div style={{ flex: 1 }}>
                <div style={T1.bold}>{edu.institute}</div>
                <div style={T1.muted}>
                  {edu.degree}
                  {edu.stream ? `, ${edu.stream}` : ""}
                  {edu.grade ? ` — CGPA: ${edu.grade}` : ""}
                </div>
              </div>
              <div style={T1.right}>
                <span style={{ ...T1.muted, fontStyle: "italic" }}>
                  {dateRange(edu.sdate, edu.edate)}
                </span>
              </div>
            </div>
          ))}
        </T1Section>
      )}

      {experiences.length > 0 && (
        <T1Section title="Experience">
          {experiences.map((exp, i) => {
            const bullets = splitBullets(exp.description);
            return (
              <div key={i} style={T1.block}>
                <div style={T1.entryHdr}>
                  <div>
                    <span style={T1.bold}>{exp.title || exp.company}</span>
                    {exp.title && exp.company && (
                      <span style={T1.muted}> · {exp.company}</span>
                    )}
                  </div>
                  <div style={T1.right}>
                    <span style={{ ...T1.muted, fontStyle: "italic" }}>
                      {dateRange(exp.sdate, exp.edate, exp.status)}
                    </span>
                  </div>
                </div>
                {exp.location && (
                  <div style={{ ...T1.muted, fontStyle: "italic" }}>
                    {exp.location}
                  </div>
                )}
                {bullets.length > 0 ? (
                  <ul style={T1.bullet}>
                    {bullets.map((b, bi) => (
                      <li key={bi} style={T1.bulletLi}>
                        {b}
                      </li>
                    ))}
                  </ul>
                ) : (
                  exp.description && (
                    <p style={{ margin: "3px 0 0 14px", fontSize: "9.8pt" }}>
                      {exp.description}
                    </p>
                  )
                )}
              </div>
            );
          })}
        </T1Section>
      )}

      {projects.length > 0 && (
        <T1Section title="Projects">
          {projects.map((proj, i) => {
            const bullets = splitBullets(proj.summary || proj.description);
            return (
              <div key={i} style={T1.block}>
                <div style={T1.entryHdr}>
                  <div>
                    <span style={T1.bold}>{proj.project_name}</span>
                    {proj.project_status && (
                      <span style={T1.muted}>
                        {" "}
                        ·{" "}
                        {proj.project_status === "ONGOING"
                          ? "Ongoing"
                          : "Completed"}
                      </span>
                    )}
                    {proj.project_link && (
                      <>
                        {" "}
                        <a
                          href={proj.project_link}
                          style={T1.link}
                          target="_blank"
                          rel="noreferrer"
                        >
                          [link]
                        </a>
                      </>
                    )}
                  </div>
                  <div style={T1.right}>
                    <span style={{ ...T1.muted, fontStyle: "italic" }}>
                      {dateRange(proj.sdate, proj.edate, proj.project_status)}
                    </span>
                  </div>
                </div>
                {bullets.length > 0 ? (
                  <ul style={T1.bullet}>
                    {bullets.map((b, bi) => (
                      <li key={bi} style={T1.bulletLi}>
                        {b}
                      </li>
                    ))}
                  </ul>
                ) : (
                  (proj.summary || proj.description) && (
                    <p style={{ margin: "3px 0 0 14px", fontSize: "9.8pt" }}>
                      {proj.summary || proj.description}
                    </p>
                  )
                )}
              </div>
            );
          })}
        </T1Section>
      )}

      {skillNames.length > 0 && (
        <T1Section title="Technical Skills">
          {chunkArray(skillNames, 9).map((row, i) => (
            <div key={i} style={T1.skillLine}>
              {i === 0 && <strong>Skills: </strong>}
              {row.join(" · ")}
            </div>
          ))}
        </T1Section>
      )}

      {achievements.length > 0 && (
        <T1Section title="Achievements &amp; Awards">
          {achievements.map((ach, i) => (
            <div key={i} style={T1.listItem}>
              <div style={{ flex: 1 }}>
                <span style={T1.bold}>{ach.achievement}</span>
                {ach.issuer && <span style={T1.muted}> — {ach.issuer}</span>}
                {ach.description && (
                  <div style={T1.muted}>{ach.description}</div>
                )}
              </div>
              <div style={T1.right}>
                <span style={T1.muted}>{formatDate(ach.date_earned)}</span>
              </div>
            </div>
          ))}
        </T1Section>
      )}

      {courses.length > 0 && (
        <T1Section title="Courses &amp; Certifications">
          {courses.map((c, i) => (
            <div key={i} style={T1.listItem}>
              <div style={{ flex: 1 }}>
                <span style={T1.bold}>{c.course_name}</span>
                {c.license_no && (
                  <span style={T1.muted}> · {c.license_no}</span>
                )}
                {c.description && <div style={T1.muted}>{c.description}</div>}
              </div>
              <div style={T1.right}>
                <span style={T1.muted}>{dateRange(c.sdate, c.edate)}</span>
              </div>
            </div>
          ))}
        </T1Section>
      )}

      {extracurriculars.length > 0 && (
        <T1Section title="Extracurricular Activities">
          {extracurriculars.map((ex, i) => (
            <div key={i} style={T1.listItem}>
              <div style={{ flex: 1 }}>
                <span style={T1.bold}>{ex.event_name}</span>
                {ex.name_of_position && (
                  <span style={T1.muted}> — {ex.name_of_position}</span>
                )}
                {ex.description && <div style={T1.muted}>{ex.description}</div>}
              </div>
              <div style={T1.right}>
                <span style={T1.muted}>{formatDate(ex.date_earned)}</span>
              </div>
            </div>
          ))}
        </T1Section>
      )}

      {publications.length > 0 && (
        <T1Section title="Publications">
          {publications.map((pub, i) => (
            <div key={i} style={{ marginBottom: "5px", fontSize: "9.8pt" }}>
              <span style={T1.bold}>"{pub.publication_title}"</span>
              {pub.publisher && (
                <span style={T1.muted}> — {pub.publisher}</span>
              )}
              <span style={T1.muted}>
                {" "}
                ({formatDate(pub.publication_date)})
              </span>
              {pub.description && <div style={T1.muted}>{pub.description}</div>}
            </div>
          ))}
        </T1Section>
      )}

      {references.length > 0 && (
        <T1Section title="References">
          <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
            {references.map((ref, i) => (
              <div key={i} style={{ minWidth: "150px", fontSize: "9.5pt" }}>
                <div style={T1.bold}>{ref.reference_name}</div>
                {ref.post && <div style={T1.muted}>{ref.post}</div>}
                {ref.email && (
                  <a href={`mailto:${ref.email}`} style={T1.link}>
                    {ref.email}
                  </a>
                )}
                {ref.mobile_number && (
                  <div style={T1.muted}>{ref.mobile_number}</div>
                )}
              </div>
            ))}
          </div>
        </T1Section>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   TEMPLATE 2 — "Sidebar" (two-column with colour left panel)
═══════════════════════════════════════════════ */
const ACCENT2 = "#1B4F72";
const T2 = {
  page: {
    fontFamily: "'Georgia', 'Times New Roman', serif",
    fontSize: "10pt",
    color: "#111",
    backgroundColor: "#fff",
    width: "210mm",
    minHeight: "297mm",
    display: "flex",
    flexDirection: "row",
    boxSizing: "border-box",
    lineHeight: 1.4,
  },
  sidebar: {
    width: "68mm",
    minHeight: "297mm",
    backgroundColor: ACCENT2,
    padding: "14mm 8mm 12mm 10mm",
    boxSizing: "border-box",
    flexShrink: 0,
    color: "#fff",
  },
  main: { flex: 1, padding: "14mm 12mm 12mm 10mm", boxSizing: "border-box" },
  sbName: {
    fontSize: "16pt",
    fontWeight: "700",
    lineHeight: 1.2,
    marginBottom: "4px",
    color: "#fff",
  },
  sbSub: { fontSize: "9pt", color: "#cde", marginBottom: "8px" },
  sbInfo: {
    fontSize: "8.5pt",
    color: "#bde",
    marginBottom: "3px",
    wordBreak: "break-all",
  },
  sbLink: { color: "#90CAF9", textDecoration: "none", fontSize: "8.5pt" },
  sbSecTitle: {
    fontSize: "9.5pt",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: "#90CAF9",
    borderBottom: "1px solid #4a7fa5",
    paddingBottom: "2px",
    marginTop: "14px",
    marginBottom: "6px",
  },
  sbItem: { fontSize: "8.5pt", color: "#deeeff", marginBottom: "4px" },
  sbSkill: { fontSize: "8.5pt", color: "#fff", marginBottom: "3px" },
  sbRatingBar: {
    height: "4px",
    backgroundColor: "#4a7fa5",
    borderRadius: "2px",
    marginBottom: "5px",
  },
  sbRatingFill: (v) => ({
    height: "100%",
    width: `${v || 80}%`,
    backgroundColor: "#90CAF9",
    borderRadius: "2px",
  }),

  secTitle: {
    fontSize: "11pt",
    fontWeight: "700",
    color: ACCENT2,
    borderBottom: `2px solid ${ACCENT2}`,
    paddingBottom: "2px",
    marginTop: "12px",
    marginBottom: "7px",
    letterSpacing: "0.04em",
  },
  entryHdr: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  bold: { fontWeight: "700", fontSize: "10.5pt" },
  muted: { color: "#666", fontSize: "9pt", fontStyle: "italic" },
  right: {
    textAlign: "right",
    whiteSpace: "nowrap",
    marginLeft: "6px",
    flexShrink: 0,
  },
  bullet: {
    marginLeft: "14px",
    paddingLeft: "0",
    marginTop: "3px",
    listStyleType: "disc",
  },
  bulletLi: { marginBottom: "2px", fontSize: "9.5pt" },
  block: { marginBottom: "10px" },
  link: { color: ACCENT2, textDecoration: "none" },
};

function T2SbSection({ title, children }) {
  return (
    <div>
      <div style={T2.sbSecTitle}>{title}</div>
      {children}
    </div>
  );
}
function T2Section({ title, children }) {
  return (
    <div>
      <div style={T2.secTitle}>{title}</div>
      {children}
    </div>
  );
}

function Template2({ data, targetRef }) {
  const {
    fullName,
    email,
    phone,
    dept,
    prog,
    cpi,
    batch,
    linkedin,
    github,
    portfolio,
    aboutMe,
    skillNames,
    education,
    experiences,
    projects,
    achievements,
    extracurriculars,
    courses,
    publications,
    references,
  } = data;

  return (
    <div ref={targetRef} style={T2.page}>
      {/* ── SIDEBAR ── */}
      <div style={T2.sidebar}>
        <div style={T2.sbName}>{fullName}</div>
        <div style={T2.sbSub}>
          {prog}
          {prog && dept ? " · " : ""}
          {dept}
        </div>
        {cpi !== "" && (
          <div style={T2.sbInfo}>
            CPI: <strong>{cpi}</strong>
            {batch ? `  |  Batch ${batch}` : ""}
          </div>
        )}
        {phone && <div style={T2.sbInfo}>✆ {phone}</div>}
        {email && (
          <div style={T2.sbInfo}>
            ✉{" "}
            <a href={`mailto:${email}`} style={T2.sbLink}>
              {email}
            </a>
          </div>
        )}
        {linkedin && (
          <div style={T2.sbInfo}>
            <a
              href={linkedin}
              style={T2.sbLink}
              target="_blank"
              rel="noreferrer"
            >
              LinkedIn
            </a>
          </div>
        )}
        {github && (
          <div style={T2.sbInfo}>
            <a href={github} style={T2.sbLink} target="_blank" rel="noreferrer">
              GitHub
            </a>
          </div>
        )}
        {portfolio && (
          <div style={T2.sbInfo}>
            <a
              href={portfolio}
              style={T2.sbLink}
              target="_blank"
              rel="noreferrer"
            >
              Portfolio
            </a>
          </div>
        )}

        {skillNames.length > 0 && (
          <T2SbSection title="Skills">
            {skillNames.map((s, i) => (
              <div key={i}>
                <div style={T2.sbSkill}>{s}</div>
              </div>
            ))}
          </T2SbSection>
        )}

        {achievements.length > 0 && (
          <T2SbSection title="Achievements">
            {achievements.map((ach, i) => (
              <div key={i} style={T2.sbItem}>
                • {ach.achievement}
                {ach.issuer ? ` (${ach.issuer})` : ""}
              </div>
            ))}
          </T2SbSection>
        )}

        {courses.length > 0 && (
          <T2SbSection title="Courses">
            {courses.map((c, i) => (
              <div key={i} style={T2.sbItem}>
                • {c.course_name}
              </div>
            ))}
          </T2SbSection>
        )}

        {extracurriculars.length > 0 && (
          <T2SbSection title="Activities">
            {extracurriculars.map((ex, i) => (
              <div key={i} style={T2.sbItem}>
                • {ex.event_name}
                {ex.name_of_position ? ` — ${ex.name_of_position}` : ""}
              </div>
            ))}
          </T2SbSection>
        )}
      </div>

      {/* ── MAIN ── */}
      <div style={T2.main}>
        {aboutMe && (
          <T2Section title="Profile">
            <p
              style={{ margin: "0 0 6px", fontSize: "9.5pt", lineHeight: 1.5 }}
            >
              {aboutMe}
            </p>
          </T2Section>
        )}

        {education.length > 0 && (
          <T2Section title="Education">
            {education.map((edu, i) => (
              <div key={i} style={T2.block}>
                <div style={T2.entryHdr}>
                  <div style={T2.bold}>{edu.institute}</div>
                  <div style={{ ...T2.muted, ...T2.right }}>
                    {dateRange(edu.sdate, edu.edate)}
                  </div>
                </div>
                <div style={T2.muted}>
                  {edu.degree}
                  {edu.stream ? `, ${edu.stream}` : ""}
                  {edu.grade ? ` — CGPA: ${edu.grade}` : ""}
                </div>
              </div>
            ))}
          </T2Section>
        )}

        {experiences.length > 0 && (
          <T2Section title="Experience">
            {experiences.map((exp, i) => {
              const bullets = splitBullets(exp.description);
              return (
                <div key={i} style={T2.block}>
                  <div style={T2.entryHdr}>
                    <div>
                      <span style={T2.bold}>{exp.title || exp.company}</span>
                      {exp.title && exp.company && (
                        <span style={T2.muted}> · {exp.company}</span>
                      )}
                    </div>
                    <div style={{ ...T2.muted, ...T2.right }}>
                      {dateRange(exp.sdate, exp.edate, exp.status)}
                    </div>
                  </div>
                  {exp.location && <div style={T2.muted}>{exp.location}</div>}
                  {bullets.length > 0 ? (
                    <ul style={T2.bullet}>
                      {bullets.map((b, bi) => (
                        <li key={bi} style={T2.bulletLi}>
                          {b}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    exp.description && (
                      <p style={{ margin: "3px 0 0 12px", fontSize: "9.5pt" }}>
                        {exp.description}
                      </p>
                    )
                  )}
                </div>
              );
            })}
          </T2Section>
        )}

        {projects.length > 0 && (
          <T2Section title="Projects">
            {projects.map((proj, i) => {
              const bullets = splitBullets(proj.summary || proj.description);
              return (
                <div key={i} style={T2.block}>
                  <div style={T2.entryHdr}>
                    <div>
                      <span style={T2.bold}>{proj.project_name}</span>
                      {proj.project_link && (
                        <>
                          {" "}
                          <a
                            href={proj.project_link}
                            style={T2.link}
                            target="_blank"
                            rel="noreferrer"
                          >
                            [link]
                          </a>
                        </>
                      )}
                    </div>
                    <div style={{ ...T2.muted, ...T2.right }}>
                      {dateRange(proj.sdate, proj.edate, proj.project_status)}
                    </div>
                  </div>
                  {bullets.length > 0 ? (
                    <ul style={T2.bullet}>
                      {bullets.map((b, bi) => (
                        <li key={bi} style={T2.bulletLi}>
                          {b}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    (proj.summary || proj.description) && (
                      <p style={{ margin: "3px 0 0 12px", fontSize: "9.5pt" }}>
                        {proj.summary || proj.description}
                      </p>
                    )
                  )}
                </div>
              );
            })}
          </T2Section>
        )}

        {publications.length > 0 && (
          <T2Section title="Publications">
            {publications.map((pub, i) => (
              <div key={i} style={{ marginBottom: "5px", fontSize: "9.5pt" }}>
                <span style={{ fontWeight: "700" }}>
                  "{pub.publication_title}"
                </span>
                {pub.publisher && (
                  <span style={T2.muted}> — {pub.publisher}</span>
                )}
                <span style={T2.muted}>
                  {" "}
                  ({formatDate(pub.publication_date)})
                </span>
              </div>
            ))}
          </T2Section>
        )}

        {references.length > 0 && (
          <T2Section title="References">
            <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
              {references.map((ref, i) => (
                <div key={i} style={{ fontSize: "9.5pt", minWidth: "140px" }}>
                  <div style={{ fontWeight: "700" }}>{ref.reference_name}</div>
                  {ref.post && <div style={T2.muted}>{ref.post}</div>}
                  {ref.email && (
                    <a href={`mailto:${ref.email}`} style={T2.link}>
                      {ref.email}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </T2Section>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   TEMPLATE 3 — "Modern" (coloured rule header, clean sans-serif)
═══════════════════════════════════════════════ */
const ACCENT3 = "#2E4057";
const RED3 = "#C0392B";

const T3 = {
  page: {
    fontFamily: "'Arial', Helvetica, sans-serif",
    fontSize: "10pt",
    color: "#222",
    backgroundColor: "#fff",
    width: "210mm",
    minHeight: "297mm",
    padding: "0",
    boxSizing: "border-box",
    lineHeight: 1.4,
  },
  header: {
    backgroundColor: ACCENT3,
    color: "#fff",
    padding: "10mm 14mm 8mm 14mm",
    boxSizing: "border-box",
  },
  hName: {
    fontSize: "24pt",
    fontWeight: "700",
    letterSpacing: "0.02em",
    marginBottom: "4px",
  },
  hProg: { fontSize: "11pt", color: "#a8c0d6", marginBottom: "6px" },
  hMeta: {
    display: "flex",
    flexWrap: "wrap",
    gap: "4px 18px",
    fontSize: "9pt",
    color: "#c8dce8",
  },
  hLink: { color: "#7EC8E3", textDecoration: "none" },

  body: { padding: "8mm 14mm 12mm 14mm", boxSizing: "border-box" },

  secRow: {
    display: "flex",
    alignItems: "flex-start",
    marginTop: "11px",
    marginBottom: "0",
  },
  secLabel: {
    fontSize: "9pt",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    color: ACCENT3,
    width: "28mm",
    flexShrink: 0,
    paddingTop: "2px",
    borderTop: `2px solid ${ACCENT3}`,
  },
  secContent: { flex: 1, borderTop: `1px solid #ddd`, paddingTop: "4px" },

  entryHdr: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  bold: { fontWeight: "700", fontSize: "10.5pt" },
  muted: { color: "#666", fontSize: "9pt", fontStyle: "italic" },
  right: {
    textAlign: "right",
    whiteSpace: "nowrap",
    marginLeft: "6px",
    flexShrink: 0,
    color: "#666",
    fontSize: "9pt",
  },
  bullet: {
    marginLeft: "14px",
    paddingLeft: "0",
    marginTop: "3px",
    listStyleType: "disc",
  },
  bulletLi: { marginBottom: "2px", fontSize: "9.5pt" },
  block: { marginBottom: "8px" },
  tag: {
    display: "inline-block",
    backgroundColor: "#ECF0F1",
    color: "#555",
    borderRadius: "3px",
    padding: "1px 6px",
    marginRight: "4px",
    marginBottom: "3px",
    fontSize: "9pt",
  },
  link: { color: ACCENT3, textDecoration: "none" },
};

function T3Section({ label, children }) {
  return (
    <div style={T3.secRow}>
      <div style={T3.secLabel}>{label}</div>
      <div style={T3.secContent}>{children}</div>
    </div>
  );
}

function Template3({ data, targetRef }) {
  const {
    fullName,
    email,
    phone,
    dept,
    prog,
    cpi,
    batch,
    linkedin,
    github,
    portfolio,
    aboutMe,
    skillNames,
    education,
    experiences,
    projects,
    achievements,
    extracurriculars,
    courses,
    publications,
    patents,
    references,
  } = data;

  return (
    <div ref={targetRef} style={T3.page}>
      {/* ── HEADER BAND ── */}
      <div style={T3.header}>
        <div style={T3.hName}>{fullName}</div>
        {(prog || dept) && (
          <div style={T3.hProg}>
            {[prog, dept].filter(Boolean).join("  ·  ")}
          </div>
        )}
        <div style={T3.hMeta}>
          {phone && <span>✆ {phone}</span>}
          {email && (
            <a href={`mailto:${email}`} style={T3.hLink}>
              ✉ {email}
            </a>
          )}
          {cpi && (
            <span>
              CPI {cpi}
              {batch ? ` · Batch ${batch}` : ""}
            </span>
          )}
          {linkedin && (
            <a
              href={linkedin}
              style={T3.hLink}
              target="_blank"
              rel="noreferrer"
            >
              LinkedIn
            </a>
          )}
          {github && (
            <a href={github} style={T3.hLink} target="_blank" rel="noreferrer">
              GitHub
            </a>
          )}
          {portfolio && (
            <a
              href={portfolio}
              style={T3.hLink}
              target="_blank"
              rel="noreferrer"
            >
              Portfolio
            </a>
          )}
        </div>
      </div>

      <div style={T3.body}>
        {aboutMe && (
          <T3Section label="Profile">
            <p
              style={{ margin: "0 0 6px", lineHeight: 1.5, fontSize: "9.5pt" }}
            >
              {aboutMe}
            </p>
          </T3Section>
        )}

        {education.length > 0 && (
          <T3Section label="Education">
            {education.map((edu, i) => (
              <div key={i} style={T3.block}>
                <div style={T3.entryHdr}>
                  <div style={T3.bold}>{edu.institute}</div>
                  <div style={T3.right}>{dateRange(edu.sdate, edu.edate)}</div>
                </div>
                <div style={T3.muted}>
                  {edu.degree}
                  {edu.stream ? `, ${edu.stream}` : ""}
                  {edu.grade ? ` — CGPA: ${edu.grade}` : ""}
                </div>
              </div>
            ))}
          </T3Section>
        )}

        {experiences.length > 0 && (
          <T3Section label="Experience">
            {experiences.map((exp, i) => {
              const bullets = splitBullets(exp.description);
              return (
                <div key={i} style={T3.block}>
                  <div style={T3.entryHdr}>
                    <div>
                      <span style={T3.bold}>{exp.title || exp.company}</span>
                      {exp.title && exp.company && (
                        <span style={T3.muted}> · {exp.company}</span>
                      )}
                    </div>
                    <div style={T3.right}>
                      {dateRange(exp.sdate, exp.edate, exp.status)}
                      {exp.location ? ` · ${exp.location}` : ""}
                    </div>
                  </div>
                  {bullets.length > 0 ? (
                    <ul style={T3.bullet}>
                      {bullets.map((b, bi) => (
                        <li key={bi} style={T3.bulletLi}>
                          {b}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    exp.description && (
                      <p style={{ margin: "3px 0 0 10px", fontSize: "9.5pt" }}>
                        {exp.description}
                      </p>
                    )
                  )}
                </div>
              );
            })}
          </T3Section>
        )}

        {projects.length > 0 && (
          <T3Section label="Projects">
            {projects.map((proj, i) => {
              const bullets = splitBullets(proj.summary || proj.description);
              return (
                <div key={i} style={T3.block}>
                  <div style={T3.entryHdr}>
                    <div>
                      <span style={T3.bold}>{proj.project_name}</span>
                      {proj.project_status && (
                        <span style={{ ...T3.muted, marginLeft: "6px" }}>
                          {proj.project_status === "ONGOING"
                            ? "Ongoing"
                            : "Completed"}
                        </span>
                      )}
                      {proj.project_link && (
                        <>
                          {" "}
                          <a
                            href={proj.project_link}
                            style={T3.link}
                            target="_blank"
                            rel="noreferrer"
                          >
                            [link]
                          </a>
                        </>
                      )}
                    </div>
                    <div style={T3.right}>
                      {dateRange(proj.sdate, proj.edate, proj.project_status)}
                    </div>
                  </div>
                  {bullets.length > 0 ? (
                    <ul style={T3.bullet}>
                      {bullets.map((b, bi) => (
                        <li key={bi} style={T3.bulletLi}>
                          {b}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    (proj.summary || proj.description) && (
                      <p style={{ margin: "3px 0 0 10px", fontSize: "9.5pt" }}>
                        {proj.summary || proj.description}
                      </p>
                    )
                  )}
                </div>
              );
            })}
          </T3Section>
        )}

        {skillNames.length > 0 && (
          <T3Section label="Skills">
            <div style={{ padding: "3px 0" }}>
              {skillNames.map((s, i) => (
                <span key={i} style={T3.tag}>
                  {s}
                </span>
              ))}
            </div>
          </T3Section>
        )}

        {achievements.length > 0 && (
          <T3Section label="Awards">
            {achievements.map((ach, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "3px",
                  fontSize: "9.5pt",
                }}
              >
                <div>
                  <strong>{ach.achievement}</strong>
                  {ach.issuer && <span style={T3.muted}> — {ach.issuer}</span>}
                  {ach.description && (
                    <div style={{ ...T3.muted, fontStyle: "normal" }}>
                      {ach.description}
                    </div>
                  )}
                </div>
                <div style={T3.right}>{formatDate(ach.date_earned)}</div>
              </div>
            ))}
          </T3Section>
        )}

        {courses.length > 0 && (
          <T3Section label="Courses">
            {courses.map((c, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "3px",
                  fontSize: "9.5pt",
                }}
              >
                <div>
                  <strong>{c.course_name}</strong>
                  {c.license_no && (
                    <span style={T3.muted}> · {c.license_no}</span>
                  )}
                </div>
                <div style={T3.right}>{dateRange(c.sdate, c.edate)}</div>
              </div>
            ))}
          </T3Section>
        )}

        {extracurriculars.length > 0 && (
          <T3Section label="Activities">
            {extracurriculars.map((ex, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "3px",
                  fontSize: "9.5pt",
                }}
              >
                <div>
                  <strong>{ex.event_name}</strong>
                  {ex.name_of_position && (
                    <span style={T3.muted}> — {ex.name_of_position}</span>
                  )}
                </div>
                <div style={T3.right}>{formatDate(ex.date_earned)}</div>
              </div>
            ))}
          </T3Section>
        )}

        {publications.length > 0 && (
          <T3Section label="Publications">
            {publications.map((pub, i) => (
              <div key={i} style={{ marginBottom: "4px", fontSize: "9.5pt" }}>
                <strong>"{pub.publication_title}"</strong>
                {pub.publisher && (
                  <span style={T3.muted}> — {pub.publisher}</span>
                )}
                <span style={T3.muted}>
                  {" "}
                  ({formatDate(pub.publication_date)})
                </span>
              </div>
            ))}
          </T3Section>
        )}

        {patents.length > 0 && (
          <T3Section label="Patents">
            {patents.map((p, i) => (
              <div key={i} style={{ marginBottom: "4px", fontSize: "9.5pt" }}>
                <strong>{p.patent_name}</strong>
                {p.patent_office && (
                  <span style={T3.muted}> — {p.patent_office}</span>
                )}
                <span style={T3.muted}> ({formatDate(p.patent_date)})</span>
              </div>
            ))}
          </T3Section>
        )}

        {references.length > 0 && (
          <T3Section label="References">
            <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
              {references.map((ref, i) => (
                <div key={i} style={{ fontSize: "9.5pt", minWidth: "140px" }}>
                  <div style={{ fontWeight: "700" }}>{ref.reference_name}</div>
                  {ref.post && <div style={T3.muted}>{ref.post}</div>}
                  {ref.email && (
                    <a href={`mailto:${ref.email}`} style={T3.link}>
                      {ref.email}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </T3Section>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   TEMPLATE REGISTRY
═══════════════════════════════════════════════ */
const TEMPLATES = [
  {
    value: "classic",
    label: "Classic",
    icon: <Layout size={16} />,
    desc: "Black & white ATS-friendly single column",
    Component: Template1,
  },
  {
    value: "sidebar",
    label: "Sidebar",
    icon: <Columns size={16} />,
    desc: "Two-column with coloured sidebar",
    Component: Template2,
  },
  {
    value: "modern",
    label: "Modern",
    icon: <Newspaper size={16} />,
    desc: "Dark header band with labelled sections",
    Component: Template3,
  },
];

/* ═══════════════════════════════════════════════
   MODAL WRAPPER
═══════════════════════════════════════════════ */
export default function ResumeGenerator({ opened, onClose, cvData }) {
  const targetRef = useRef();
  const [templateId, setTemplateId] = useState("classic");

  const handleDownloadPdf = () => {
    generatePDF(targetRef, {
      filename: `Resume_${templateId}.pdf`,
      page: { margin: 0, format: "A4" },
    });
  };

  if (!cvData) {
    return (
      <Modal
        opened={opened}
        onClose={onClose}
        title="Generate Resume"
        size="xl"
      >
        <Text>Loading CV data…</Text>
      </Modal>
    );
  }

  const data = extractCvFields(cvData);
  const active = TEMPLATES.find((t) => t.value === templateId);
  const ActiveComponent = active?.Component;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Auto-generate Resume"
      size="auto"
      centered
      styles={{
        header: { paddingBottom: 4 },
        body: { padding: "8px 16px 16px" },
      }}
    >
      <Stack spacing="sm">
        {/* ── Controls row ── */}
        <Group position="apart" align="flex-end" noWrap>
          {/* Template picker */}
          <Stack spacing={4}>
            <Text
              size="xs"
              color="dimmed"
              weight={600}
              style={{ letterSpacing: "0.06em", textTransform: "uppercase" }}
            >
              Template
            </Text>
            <SegmentedControl
              value={templateId}
              onChange={setTemplateId}
              size="sm"
              data={TEMPLATES.map((t) => ({
                value: t.value,
                label: (
                  <Tooltip
                    label={t.desc}
                    withinPortal
                    position="bottom"
                    withArrow
                  >
                    <Group spacing={5} noWrap>
                      {t.icon}
                      <span>{t.label}</span>
                    </Group>
                  </Tooltip>
                ),
              }))}
              styles={{
                root: { backgroundColor: "#f1f3f5" },
                label: { fontSize: "12px", padding: "5px 14px" },
              }}
            />
          </Stack>

          <Button
            leftIcon={<Printer size={16} />}
            onClick={handleDownloadPdf}
            variant="filled"
            color="blue"
          >
            Download PDF
          </Button>
        </Group>

        {/* ── Preview ── */}
        <Paper
          withBorder
          shadow="sm"
          p={0}
          style={{ overflow: "auto", maxHeight: "74vh", background: "#e8e8e8" }}
        >
          {/* Scale ~78% to fit nicely in the modal */}
          <div
            style={{
              width: "210mm",
              transform: "scale(0.78)",
              transformOrigin: "top left",
              /* so the container shrinks with the scaled content */
              height: "calc(297mm * 0.78)",
            }}
          >
            {ActiveComponent && (
              <ActiveComponent data={data} targetRef={targetRef} />
            )}
          </div>
        </Paper>
      </Stack>
    </Modal>
  );
}
