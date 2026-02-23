
import { 
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, 
    WidthType, Header, ImageRun, AlignmentType, BorderStyle, 
    VerticalAlign, ShadingType
} from "docx";
import FileSaver from "file-saver";
// Fix: Changed OrganizationProfile to OrganisationProfile
import { OrganisationProfile, Animal, Incident, User, SiteLogEntry } from "../types";

const MARGINS = { top: 720, bottom: 720, left: 720, right: 720 };
const COLOR_PRIMARY = "111827"; 
const COLOR_ACCENT = "6B7280";
const COLOR_BLACK = "000000";

const urlToBuffer = async (url: string): Promise<ArrayBuffer | null> => {
    try {
        const response = await fetch(url);
        return await response.arrayBuffer();
    } catch (error) {
        console.error("Failed to load image", error);
        return null;
    }
};

export const DocumentService = {
    // Fix: Changed OrganizationProfile to OrganisationProfile
    createHeader: async (profile: OrganisationProfile | null, reportTitle: string = "STATUTORY RECORD", dateRangeText: string): Promise<Header> => {
        let logoRun: ImageRun | TextRun = new TextRun("");
        if (profile?.logoUrl) {
            const buffer = await urlToBuffer(profile.logoUrl);
            if (buffer) logoRun = new ImageRun({ data: buffer, transformation: { width: 60, height: 60 } });
        }
        const orgName = (profile?.name || "KENT OWL ACADEMY").toUpperCase();
        const licenseNo = profile?.licenceNumber || "UNKNOWN";

        return new Header({
            children: [
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    borders: { top: { style: BorderStyle.NIL }, bottom: { style: BorderStyle.SINGLE, size: 24, color: "000000" }, left: { style: BorderStyle.NIL }, right: { style: BorderStyle.NIL }, insideVertical: { style: BorderStyle.NIL }, insideHorizontal: { style: BorderStyle.NIL } },
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph({ children: [logoRun] })], width: { size: 10, type: WidthType.PERCENTAGE }, verticalAlign: VerticalAlign.CENTER }),
                                new TableCell({
                                    children: [
                                        new Paragraph({ children: [new TextRun({ text: reportTitle, bold: true, size: 40, font: "Arial Black", color: COLOR_PRIMARY })], spacing: { after: 60 } }),
                                        new Paragraph({ children: [new TextRun({ text: `ZOO LICENSING ACT 1981 SECTION 9 • ${orgName}`, bold: true, size: 16, font: "Arial", color: COLOR_ACCENT })], spacing: { after: 40 } }),
                                        new Paragraph({ children: [new TextRun({ text: `LICENSE: ${licenseNo}`, bold: true, size: 16, font: "Arial", color: "9CA3AF" })], spacing: { after: 120 } })
                                    ],
                                    width: { size: 70, type: WidthType.PERCENTAGE },
                                    verticalAlign: VerticalAlign.CENTER,
                                    margins: { left: 200 }
                                }),
                                new TableCell({
                                    children: [
                                        new Table({
                                            width: { size: 2400, type: WidthType.DXA },
                                            rows: [new TableRow({ children: [new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: dateRangeText, bold: true, color: "FFFFFF", font: "Arial", size: 24 })], alignment: AlignmentType.CENTER })], shading: { fill: "111827", type: ShadingType.CLEAR, color: "auto" }, verticalAlign: VerticalAlign.CENTER, margins: { top: 100, bottom: 100, left: 100, right: 100 }, borders: { top: { style: BorderStyle.NIL }, bottom: { style: BorderStyle.NIL }, left: { style: BorderStyle.NIL }, right: { style: BorderStyle.NIL } } })] })]
                                        })
                                    ],
                                    width: { size: 20, type: WidthType.PERCENTAGE },
                                    verticalAlign: VerticalAlign.CENTER,
                                }),
                            ],
                        }),
                    ],
                }),
                new Paragraph({ text: "", spacing: { after: 400 } }),
            ],
        });
    },

    createSignatureBlock: async (user: User | null | undefined): Promise<Paragraph[]> => {
        if (!user) return [];
        let sigImage: ImageRun | null = null;
        if (user.signature) {
            const buffer = await urlToBuffer(user.signature);
            if (buffer) sigImage = new ImageRun({ data: buffer, transformation: { width: 150, height: 60 } });
        }
        const now = new Date().toLocaleString('en-GB', { dateStyle: 'full', timeStyle: 'short' });
        return [
            new Paragraph({ text: "", spacing: { before: 800, after: 200 }, border: { top: { style: BorderStyle.SINGLE, size: 6, color: "AAAAAA" } } }),
            new Paragraph({ children: [new TextRun({ text: "Digitally Generated By: ", bold: true, font: "Arial", size: 20 }), new TextRun({ text: user.name, font: "Arial", size: 20 })] }),
            new Paragraph({ children: [new TextRun({ text: "Role: ", bold: true, font: "Arial", size: 20 }), new TextRun({ text: user.role || "Staff", font: "Arial", size: 20 })] }),
            new Paragraph({ children: [new TextRun({ text: "Date Generated: ", bold: true, font: "Arial", size: 20 }), new TextRun({ text: now, font: "Arial", size: 20 })] }),
            sigImage ? new Paragraph({ children: [sigImage], spacing: { before: 200, after: 100 } }) : new Paragraph({}),
            new Paragraph({ children: [new TextRun({ text: "This record is electronically verified under the Zoo Licensing Act verification protocols.", italics: true, size: 16, color: "666666", font: "Arial" })], spacing: { before: 100 } })
        ];
    },

    // Fix: Changed OrganizationProfile to OrganisationProfile
    generateCensus: async (data: any[], profile: OrganisationProfile | null, year: string, currentUser?: User | null) => {
        const header = await DocumentService.createHeader(profile, "ANNUAL STATUTORY CENSUS", year);
        const signature = await DocumentService.createSignatureBlock(currentUser);
        const tableRows = [
            new TableRow({
                tableHeader: true,
                children: ["Species", "Scientific Name", "Male", "Female", "Unknown", "Total"].map(text => 
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 24, font: "Arial", color: "FFFFFF" })] })], shading: { fill: "1F2937" }, margins: { top: 100, bottom: 100, left: 100, right: 100 } })
                ),
            }),
            ...data.map(d => new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: d.species, bold: true, size: 22, font: "Arial" })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: d.latin, italics: true, size: 22, font: "Arial" })] })] }),
                    new TableCell({ children: [new Paragraph({ text: d.male.toString(), alignment: AlignmentType.CENTER })] }),
                    new TableCell({ children: [new Paragraph({ text: d.female.toString(), alignment: AlignmentType.CENTER })] }),
                    new TableCell({ children: [new Paragraph({ text: d.unknown.toString(), alignment: AlignmentType.CENTER })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: d.total.toString(), bold: true, size: 22 })], alignment: AlignmentType.CENTER })], shading: { fill: "F3F4F6" } }),
                ]
            }))
        ];

        const doc = new Document({
            styles: { default: { document: { run: { font: "Arial", size: 22, color: COLOR_BLACK } } } },
            sections: [{ headers: { default: header }, properties: { page: { margin: MARGINS } }, children: [new Table({ rows: tableRows, width: { size: 100, type: WidthType.PERCENTAGE } }), ...signature] }],
        });
        const blob = await Packer.toBlob(doc);
        FileSaver.saveAs(blob, `Annual_Census_${year}.docx`);
    },

    // Fix: Changed OrganizationProfile to OrganisationProfile
    generateDailyRoundsChecklist: async (logs: SiteLogEntry[], animals: Animal[], users: User[], profile: OrganisationProfile | null, dateRangeText: string, currentUser: User | null, reportTitle: string = "ROUNDS CHECKLIST") => {
        const header = await DocumentService.createHeader(profile, reportTitle, dateRangeText);
        const docChildren: any[] = [];
        const groups: Record<string, Record<string, { am?: SiteLogEntry, pm?: SiteLogEntry }>> = {};
        logs.forEach(l => {
            let d: any = {}; try { d = JSON.parse(l.description); } catch(e) { return; }
            if (!groups[l.date]) groups[l.date] = {};
            if (!groups[l.date][d.section]) groups[l.date][d.section] = {};
            if (d.type === 'Morning') groups[l.date][d.section].am = l;
            if (d.type === 'Evening') groups[l.date][d.section].pm = l;
        });

        for (const dateKey of Object.keys(groups).sort().reverse()) {
            for (const sectionKey of Object.keys(groups[dateKey])) {
                const group = groups[dateKey][sectionKey];
                const amData = group.am ? JSON.parse(group.am.description) : null;
                const pmData = group.pm ? JSON.parse(group.pm.description) : null;
                const sectionAnimals = animals.filter(a => a.category === sectionKey && !a.archived);
                docChildren.push(new Paragraph({ children: [new TextRun({ text: `${new Date(dateKey).toLocaleDateString('en-GB')} - ${sectionKey.toUpperCase()}`, bold: true, size: 28, font: "Arial" })], spacing: { before: 400, after: 200 }, border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: "CCCCCC" } } }));
                const tableRows = [new TableRow({ tableHeader: true, children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Animal", bold: true, size: 20, color: "FFFFFF" })] })], shading: { fill: "1F2937" }, width: { size: 20, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "AM Well", bold: true, size: 16, color: "FFFFFF" })], alignment: AlignmentType.CENTER })], shading: { fill: "1F2937" }, width: { size: 7, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "AM Water", bold: true, size: 16, color: "FFFFFF" })], alignment: AlignmentType.CENTER })], shading: { fill: "1F2937" }, width: { size: 7, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "AM Sec", bold: true, size: 16, color: "FFFFFF" })], alignment: AlignmentType.CENTER })], shading: { fill: "1F2937" }, width: { size: 7, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "PM Well", bold: true, size: 16, color: "FFFFFF" })], alignment: AlignmentType.CENTER })], shading: { fill: "1F2937" }, width: { size: 7, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "PM Water", bold: true, size: 16, color: "FFFFFF" })], alignment: AlignmentType.CENTER })], shading: { fill: "1F2937" }, width: { size: 7, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "PM Sec", bold: true, size: 16, color: "FFFFFF" })], alignment: AlignmentType.CENTER })], shading: { fill: "1F2937" }, width: { size: 7, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Comments", bold: true, size: 18, color: "FFFFFF" })] })], shading: { fill: "1F2937" }, width: { size: 38, type: WidthType.PERCENTAGE } }),
                ] })];
                sectionAnimals.forEach(animal => {
                    const am = amData?.details?.[animal.id]; const pm = pmData?.details?.[animal.id];
                    tableRows.push(new TableRow({ children: [
                        new TableCell({ children: [new Paragraph({ text: animal.name })] }),
                        new TableCell({ children: [new Paragraph({ text: am?.isAlive ? "✓" : "", alignment: AlignmentType.CENTER })] }),
                        new TableCell({ children: [new Paragraph({ text: am?.isWatered ? "✓" : "", alignment: AlignmentType.CENTER })] }),
                        new TableCell({ children: [new Paragraph({ text: (am?.isSecure || am?.securityIssue) ? "✓" : "", alignment: AlignmentType.CENTER })] }),
                        new TableCell({ children: [new Paragraph({ text: pm?.isAlive ? "✓" : "", alignment: AlignmentType.CENTER })] }),
                        new TableCell({ children: [new Paragraph({ text: pm?.isWatered ? "✓" : "", alignment: AlignmentType.CENTER })] }),
                        new TableCell({ children: [new Paragraph({ text: (pm?.isSecure || pm?.securityIssue) ? "✓" : "", alignment: AlignmentType.CENTER })] }),
                        // Fixed size property: must be within TextRun
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: [am?.healthIssue, am?.securityIssue, pm?.healthIssue, pm?.securityIssue].filter(Boolean).join('; '), size: 16 })] })] }),
                    ] }));
                });
                docChildren.push(new Table({ rows: tableRows, width: { size: 100, type: WidthType.PERCENTAGE } }));
                docChildren.push(new Paragraph({ text: "", spacing: { after: 400 } }));
            }
        }
        const doc = new Document({ styles: { default: { document: { run: { font: "Arial", size: 20, color: COLOR_BLACK } } } }, sections: [{ headers: { default: header }, properties: { page: { margin: MARGINS } }, children: docChildren }] });
        const blob = await Packer.toBlob(doc);
        FileSaver.saveAs(blob, `Daily_Rounds_Audit_${new Date().toISOString().split('T')[0]}.docx`);
    },

    // Fix: Changed OrganizationProfile to OrganisationProfile
    generateStockList: async (animals: Animal[], profile: OrganisationProfile | null, currentUser?: User | null) => {
        const header = await DocumentService.createHeader(profile, "STOCK LIST (SECTION 9)", new Date().getFullYear().toString());
        const signature = await DocumentService.createSignatureBlock(currentUser);
        const tableRows = [
            new TableRow({ tableHeader: true, children: ["ID / Ring", "Common Name", "Scientific Name", "Sex", "Origin", "Arrival"].map(text => 
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 24, font: "Arial", color: "FFFFFF" })] })], shading: { fill: "1F2937" }, verticalAlign: VerticalAlign.CENTER, margins: { top: 100, bottom: 100, left: 100, right: 100 } })
            )}),
            ...animals.map(a => new TableRow({ children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: a.ringNumber || a.microchip || "-", size: 22, font: "Arial" })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: a.name, bold: true, size: 22, font: "Arial" })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: a.latinName || "-", italics: true, size: 22, font: "Arial" })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: a.sex || "?", size: 22, font: "Arial" })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: a.origin || "Unknown", size: 22, font: "Arial" })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: a.arrivalDate ? new Date(a.arrivalDate).toLocaleDateString('en-GB') : "-", size: 22, font: "Arial" })] })] }),
            ]}))
        ];
        const doc = new Document({ styles: { default: { document: { run: { font: "Arial", size: 22, color: COLOR_BLACK } } } }, sections: [{ headers: { default: header }, properties: { page: { margin: MARGINS } }, children: [new Table({ rows: tableRows, width: { size: 100, type: WidthType.PERCENTAGE } }), ...signature] }] });
        const blob = await Packer.toBlob(doc);
        FileSaver.saveAs(blob, `Stock_List_${new Date().toISOString().split('T')[0]}.docx`);
    },

    // Fix: Changed OrganizationProfile to OrganisationProfile
    generateDailyLog: async (logs: any[], profile: OrganisationProfile | null, dateRangeText: string, currentUser?: User | null, reportTitle: string = "DAILY LOG") => {
        const header = await DocumentService.createHeader(profile, reportTitle, dateRangeText);
        const signature = await DocumentService.createSignatureBlock(currentUser);
        const tableRows = [
            new TableRow({ tableHeader: true, children: ["Animal", "Time", "Weight", "Feed", "Notes / Activity", "Staff"].map(text => 
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 24, font: "Arial", color: "FFFFFF" })] })], shading: { fill: "1F2937" }, margins: { top: 100, bottom: 100, left: 100, right: 100 } })
            )}),
            ...logs.map(l => new TableRow({ children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: l.subject, bold: true, size: 22, font: "Arial" })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: l.time, size: 22, font: "Arial" })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: l.weight, size: 22, font: "Arial" })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: l.feed, size: 22, font: "Arial" })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: l.value, size: 20, font: "Arial" })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: l.initials || "-", size: 22, font: "Arial" })] })] }),
            ]}))
        ];
        const doc = new Document({ styles: { default: { document: { run: { font: "Arial", size: 22, color: COLOR_BLACK } } } }, sections: [{ headers: { default: header }, properties: { page: { margin: MARGINS } }, children: [new Table({ rows: tableRows, width: { size: 100, type: WidthType.PERCENTAGE } }), ...signature] }] });
        const blob = await Packer.toBlob(doc);
        FileSaver.saveAs(blob, `Husbandry_Log_${new Date().toISOString().split('T')[0]}.docx`);
    },

    // Fix: Changed OrganizationProfile to OrganisationProfile
    generateIncidentReport: async (incidents: Incident[], profile: OrganisationProfile | null, dateRangeText: string, currentUser?: User | null, reportTitle: string = "INCIDENT LOG") => {
        const header = await DocumentService.createHeader(profile, reportTitle, dateRangeText);
        const signature = await DocumentService.createSignatureBlock(currentUser);
        const incidentTables = incidents.map(inc => {
            return [
                new Paragraph({ text: "", spacing: { after: 300 } }),
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: [
                        new TableRow({ children: [
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "DATE/TIME", bold: true, size: 22 })] })], shading: { fill: "F3F4F6" } }),
                            new TableCell({ children: [new Paragraph({ text: `${new Date(inc.date).toLocaleDateString('en-GB')} ${inc.time}` })] }),
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "LOCATION", bold: true, size: 22 })] })], shading: { fill: "F3F4F6" } }),
                            new TableCell({ children: [new Paragraph({ text: inc.location })] }),
                        ]}),
                        new TableRow({ children: [
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "CATEGORY", bold: true, size: 22 })] })], shading: { fill: "F3F4F6" } }),
                            new TableCell({ children: [new Paragraph({ text: inc.type })] }),
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "SEVERITY", bold: true, size: 22 })] })], shading: { fill: "F3F4F6" } }),
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: inc.severity, bold: true, color: inc.severity === "Critical" ? "FF0000" : "000000" })] })] }),
                        ]}),
                        new TableRow({ children: [new TableCell({ columnSpan: 4, children: [new Paragraph({ children: [new TextRun({ text: "NARRATIVE & ACTION TAKEN", bold: true })] })], shading: { fill: "E5E7EB" } })] }),
                        new TableRow({ children: [new TableCell({ columnSpan: 4, children: [new Paragraph({ text: inc.description })] })] }),
                        new TableRow({ children: [
                            // Fixed bold property: must be within TextRun
                            new TableCell({ columnSpan: 2, children: [new Paragraph({ children: [new TextRun({ text: `Reported By: ${inc.reportedBy}`, bold: true })] })] }),
                            new TableCell({ columnSpan: 2, children: [new Paragraph({ children: [new TextRun({ text: `Status: ${inc.status}`, bold: true })], alignment: AlignmentType.RIGHT })] }),
                        ]})
                    ]
                })
            ];
        }).flat();
        const doc = new Document({ sections: [{ headers: { default: header }, properties: { page: { margin: MARGINS } }, children: [...incidentTables, ...signature] }] });
        const blob = await Packer.toBlob(doc);
        FileSaver.saveAs(blob, `Incident_Log_${new Date().toISOString().split('T')[0]}.docx`);
    }
};