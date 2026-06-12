// Single source of truth for college metadata.
//
// Edit this file directly to add or revise per-college information. The
// `code` field is the primary key and must match cut-off records in
// src/data.json. Run scripts/build-colleges.mjs to pull in any newly
// added colleges from data.json without overwriting curated fields.

export type CollegeMeta = {
  /** Primary key — matches cut-off records in data.json. */
  code: string;
  /** Headline college name, no locality suffix. */
  name: string;
  /** Sub-area, e.g. "Mysore Road" or "Yelahanka". */
  locality?: string;
  /** City, e.g. "Bengaluru". */
  city?: string;
  /** Year the institution was established. */
  established?: number;
  /** Affiliation type. */
  type?: "private" | "autonomous" | "deemed" | "government" | "university";
  /** Official website URL. */
  website?: string;
  /** 1-2 sentence description shown on the per-college hero. */
  about?: string;
  /** Latest placement stats — minimal v2 scope. */
  placement?: {
    /** Average package for CSE branch, in LPA. */
    cseAvgLpa?: number;
    /** Overall average package across branches, in LPA. */
    overallAvgLpa?: number;
    /** Year the figures are sourced from. */
    year?: number;
  };
  /** Student podcast on the user's YouTube channel, if any. */
  podcast?: {
    /** YouTube video ID (the part after `v=` in the watch URL). */
    youtubeId: string;
    /** Optional override for the embed title. */
    title?: string;
  };
};

export const COLLEGES: CollegeMeta[] = [
  {
    code: "E001",
    name: "Acharya Institute of Technology",
    locality: "Soladevanahalli",
    city: "Bengaluru",
  },
  {
    code: "E003",
    name: "A.C.S. College of Engineering",
    locality: "Kambipura Mysore Road",
    city: "Bengaluru",
  },
  {
    code: "E004",
    name: "Adichunchanagiri Institute Of Technology",
    locality: "Jyothi Nagara",
    city: "Chikkamagaluru",
  },
  {
    code: "E005",
    name: "Akash Institute of Engineering and Technology",
    locality: "Devanahalli",
    city: "Bengaluru Rural",
  },
  {
    code: "E006",
    name: "Alvas Institute of Engineering and Technology",
    locality: "Moodbidri",
    city: "Mangaluru",
  },
  {
    code: "E007",
    name: "AMC Engineering College",
    locality: "Bannerghatta Rd",
    city: "Bengaluru",
  },
  {
    code: "E009",
    name: "Angadi Institute of Technology and Management",
    locality: "Savagaon Road",
    city: "Belagavi",
  },
  {
    code: "E011",
    name: "APS College of Engineering",
    locality: "Kanakapura Road",
    city: "Bengaluru",
  },
  {
    code: "E012",
    name: "Atria Institute of Technology",
    locality: "Hebbal",
    city: "Bengaluru",
  },
  {
    code: "E013",
    name: "Akshaya Institute of Technology",
    locality: "Koratagere Road",
    city: "Tumakuru",
  },
  {
    code: "E014",
    name: "Anuvartik Mirji Bharatesh Institute of Technology",
    locality: "Shindhollicross",
    city: "Belagavi",
  },
  {
    code: "E015",
    name: "B.N.M. Institute of Technology",
    locality: "Banashankari",
    city: "Bengaluru",
  },
  {
    code: "E016",
    name: "KLE Technological University Formerly known as BVBCET",
    locality: "Vidyanagar",
    city: "Hubballi",
  },
  {
    code: "E017",
    name: "Ballari Institute of Technology And Management",
    locality: "Near Allipura",
    city: "Ballari",
  },
  {
    code: "E019",
    name: "Bangalore Institute of Technology",
    locality: "V V Puram",
    city: "Bengaluru",
    podcast: {
      youtubeId: "i_mZovvne6M",
      title: "BIT Bangalore Student Review",
    },
  },
  {
    code: "E020",
    name: "Bangalore Technological Institute",
    locality: "Chikkanayakanahalli Dinne",
    city: "Bengaluru",
  },
  {
    code: "E021",
    name: "Bapuji Institute of Engineering and Technology",
    locality: "Shamanur Road",
    city: "Davangere",
  },
  {
    code: "E023",
    name: "Basavakalyan Engineering College",
    locality: "NH9 Basavakalyan",
    city: "Bidar",
  },
  {
    code: "E024",
    name: "Basaveshwar Engineering College",
    locality: "Vidya Nagar",
    city: "Bagalkote",
  },
  {
    code: "E026",
    name: "BLDEAs V.P. Dr.P.G.Halakatti College of Engineering and Technology",
    locality: "Ashram Road",
    city: "Vijayapura",
  },
  {
    code: "E027",
    name: "BMS College of Engineering",
    locality: "Basavanagudi",
    city: "Bengaluru",
    podcast: {
      youtubeId: "cdS1Sa9iKec",
      title: "BMSCE Bangalore Student Review",
    },
  },
  {
    code: "E028",
    name: "BMS Institute of Technology and Management",
    locality: "Yelahanka",
    city: "Bengaluru",
    podcast: {
      youtubeId: "ezxl87YWUMk",
      title: "BMSIT Bangalore Student Review",
    },
  },
  {
    code: "E030",
    name: "Brindavan College of Engineering",
    locality: "Yelahanka",
    city: "Bengaluru",
  },
  {
    code: "E032",
    name: "C.M.R. Institute of Technology",
    locality: "Brookefield",
    city: "Bengaluru",
  },
  {
    code: "E033",
    name: "Cambridge Institute of Technology",
    locality: "K R Puram",
    city: "Bengaluru",
  },
  {
    code: "E035",
    name: "Channabasaveshwara Institute of Technology",
    locality: "Gubbi",
    city: "Tumakuru",
  },
  {
    code: "E036",
    name: "Chanakya University",
    locality: "Devanahalli",
    city: "Bengaluru Rural",
  },
  {
    code: "E037",
    name: "City Engineering College",
    locality: "Doddakalasandra",
    city: "Bengaluru",
  },
  {
    code: "E038",
    name: "Coorg Institute of Technology",
    locality: "Ponnampet",
    city: "South Kodagu",
  },
  {
    code: "E039",
    name: "Dayananda Sagar Academy of Technology and Management",
    locality: "Kanakpura Road",
    city: "Bengaluru",
  },
  {
    code: "E040",
    name: "Dayananda Sagar College of Engineering",
    locality: "Kumaraswamy Layout",
    city: "Bengaluru",
    podcast: {
      youtubeId: "Ul3TtSe2OK8",
      title: "DSCE Bangalore Student Review",
    },
  },
  {
    code: "E041",
    name: "DON BOSCO Institute of Technology",
    locality: "Kumbalgodu",
    city: "Bengaluru",
  },
  {
    code: "E042",
    name: "Dr. Ambedkar Institute of Technology",
    locality: "Malathahalli",
    city: "Bengaluru",
  },
  {
    code: "E043",
    name: "Yenepoya Institute of Technology formerly known as Dr. M V Shetty Institute of Technology",
    locality: "Moodbidri",
    city: "Mangaluru",
  },
  {
    code: "E044",
    name: "Dr.Shri Shri Shivakumara Mahaswamy College of Engineering",
    locality: "Nelamangala",
    city: "Bengaluru Rural",
  },
  {
    code: "E045",
    name: "Dr H N National College Of Engineering",
    locality: "Jayanagar",
    city: "Bengaluru",
  },
  {
    code: "E046",
    name: "East Point College of Engineering and Technology",
    locality: "Avalahalli",
    city: "Bengaluru",
  },
  {
    code: "E048",
    name: "East West Institute of Technology",
    locality: "BEL Layout",
    city: "Bengaluru",
  },
  {
    code: "E049",
    name: "Garden City University",
    locality: "Old Madras Road",
    city: "Bengaluru",
  },
  {
    code: "E050",
    name: "Global Academy of Technology",
    locality: "Rajarajeshwari Nagar",
    city: "Bengaluru",
  },
  {
    code: "E051",
    name: "GM Institute of Technology",
    locality: "P B Road",
    city: "Davangere",
  },
  {
    code: "E053",
    name: "Gopalan College of Engineering And Management",
    locality: "Whitefield",
    city: "Bengaluru",
  },
  {
    code: "E055",
    name: "GSSS Institute of Engineering and Technology for Women",
    locality: "Metagalli",
    city: "Mysuru",
  },
  {
    code: "E056",
    name: "H.K.E.Societys P.D.A. College of Engineering",
    locality: "Aiwan E Shahi area",
    city: "Kalaburgi",
  },
  {
    code: "E058",
    name: "Sri Jayachamarajendra College of Engineering constituent college of JSS Science and Technology University",
    locality: "Manasagangothri",
    city: "Mysuru",
  },
  {
    code: "E059",
    name: "Jawaharlal Nehru New College of Engineering JNNCE",
    locality: "Swalanga Road",
    city: "Shivamogga",
  },
  {
    code: "E060",
    name: "JSS Academy of Technical Education",
    locality: "Kengeri Main Road",
    city: "Bengaluru",
  },
  {
    code: "E061",
    name: "JSS Science and Technology University",
    locality: "Mysuru",
  },
  {
    code: "E062",
    name: "Jain College of Engineering",
    locality: "T.S Nagar",
    city: "Belagavi",
  },
  {
    code: "E063",
    name: "Jnana Vikas Institute of Technology",
    locality: "Bidadi, Ramnagar Taluk",
    city: "Bengaluru Rural",
  },
  {
    code: "E064",
    name: "Jain College of Engineering and Research",
    locality: "Udyambag",
    city: "Belagavi",
  },
  {
    code: "E065",
    name: "KLE Technological University Formerly called as KLE Dr. M.S. Sheshgiri College of Engineering and Technology",
    locality: "Udyambag",
    city: "Belagavi",
  },
  {
    code: "E066",
    name: "KLE College of Engineering and Technology",
    locality: "Chikodi Dist.",
    city: "Belagavi",
  },
  {
    code: "E067",
    name: "K.S School of Engineering And Management",
    locality: "Off Kanakapura Road",
    city: "Bengaluru",
  },
  {
    code: "E068",
    name: "K.S. Institute of Technology",
    locality: "Kanakapura Main Road",
    city: "Bengaluru",
  },
  {
    code: "E069",
    name: "KVG College Of Engineering",
    locality: "Sullia",
    city: "Dakshina Kannada",
  },
  {
    code: "E070",
    name: "Kalpataru Institute of Technology",
    locality: "B H Road",
    city: "Tiptur",
  },
  {
    code: "E071",
    name: "Karavali Institute of Technology",
    locality: "Kottara",
    city: "Mangaluru",
  },
  {
    code: "E073",
    name: "KLS Gogte Institute of Technology",
    locality: "Udyambag",
    city: "Belagavi",
  },
  {
    code: "E074",
    name: "KLS Vishwanathrao Deshpande Institute of Technology",
    locality: "Dandeli Road",
    city: "Haliyal",
  },
  {
    code: "E075",
    name: "KNS Institute of Technology",
    locality: "Yelahanka",
    city: "Bengaluru",
  },
  {
    code: "E076",
    name: "M.S. Engineering College",
    locality: "Sadahalli",
    city: "Bengaluru",
  },
  {
    code: "E077",
    name: "M.S. Ramaiah Institute of Technology",
    locality: "MSR Nagar",
    city: "Bengaluru",
    podcast: {
      youtubeId: "KX4XE15EFcg",
      title: "MS Ramaiah College Review by Student (MSRIT 2026)",
    },
  },
  {
    code: "E078",
    name: "Maharaja Institute of Technology",
    locality: "Belawadi",
    city: "Mandya",
  },
  {
    code: "E079",
    name: "Malnad College of Engineering",
    locality: "Rangoli Halla",
    city: "Hassan",
  },
  {
    code: "E080",
    name: "Mangalore Institute of Technology and Engineering",
    locality: "Moodbidri",
    city: "Mangaluru",
  },
  {
    code: "E081",
    name: "Moodalakatte Institute of Technology",
    locality: "Moodalakatte",
    city: "Udupi",
  },
  {
    code: "E082",
    name: "Maharaja Institute of Technology",
    locality: "Thandavapura",
    city: "Mysuru",
  },
  {
    code: "E083",
    name: "Mysuru Royal Institute of Technology",
    locality: "Palahallli",
    city: "Mandya District",
  },
  {
    code: "E084",
    name: "Nagarjuna College of Engineering And Technology",
    locality: "Devanahalli",
    city: "Bengaluru",
  },
  {
    code: "E085",
    name: "The National Institute of Engineering North Campus",
    locality: "Koorgalli",
    city: "Mysuru",
  },
  {
    code: "E088",
    name: "Navodaya Institute of Technology",
    locality: "Bijangera",
    city: "Raichur",
  },
  {
    code: "E089",
    name: "P.E.S.College of Engineering",
    locality: "PES College Road",
    city: "Mandya",
  },
  {
    code: "E090",
    name: "PES Institute of Technology and Management",
    locality: "Kotegangoor Cost",
    city: "Shivamogga",
  },
  {
    code: "E094",
    name: "Proudhadevaraya Institute of Technology",
    locality: "TB Dam Road",
    city: "Hosapete",
  },
  {
    code: "E095",
    name: "R V College of Engineering",
    locality: "Mysore Road",
    city: "Bengaluru",
    podcast: {
      youtubeId: "kJ6zigXV4OI",
      title: "RVCE Bangalore Honest Student Review 2026",
    },
  },
  {
    code: "E096",
    name: "R.L. Jalappa Institute of Technology",
    locality: "Kodigehalli",
    city: "Doddaballapur",
  },
  {
    code: "E097",
    name: "R.R. Institute of Technology",
    locality: "Chikkabanavara",
    city: "Bengaluru",
  },
  {
    code: "E098",
    name: "R T E Societys Rural Engineering College",
    locality: "Hulkoti",
    city: "Gadag",
  },
  {
    code: "E099",
    name: "Raja Rajeswari College of Engineering",
    locality: "Kumbalgodu",
    city: "Bengaluru",
  },
  {
    code: "E100",
    name: "Rajeev Institute of Technology",
    locality: "BM Bypass Road",
    city: "Hassan",
  },
  {
    code: "E101",
    name: "Rajiv Gandhi Institute of Technology",
    locality: "R T Nagar Post",
    city: "Bengaluru",
  },
  {
    code: "E102",
    name: "Rao Bahadur Y Mahabaleswarappa Engineering College",
    locality: "Cantonment",
    city: "Ballari",
  },
  {
    code: "E104",
    name: "RNS Institute of Technology",
    locality: "R R Nagar Post",
    city: "Bengaluru",
  },
  {
    code: "E105",
    name: "Bheemanna Khandre Institute of Technology",
    locality: "Bhalki",
    city: "Bidar",
  },
  {
    code: "E107",
    name: "SJB Institute of Technology",
    locality: "Kengeri",
    city: "Bengaluru",
  },
  {
    code: "E108",
    name: "S J C Institute of Technology",
    locality: "BB Road",
    city: "Chikkaballapur",
  },
  {
    code: "E109",
    name: "S.E.A. College of Engineering and Technology",
    locality: "K R Puram",
    city: "Bengaluru",
  },
  {
    code: "E110",
    name: "SSETs S.G. Balekundri Institute of Technology",
    locality: "Shivabasva Nagar",
    city: "Belagavi",
  },
  {
    code: "E111",
    name: "S.J.P.N Trust s Hirasugar Institute of Technology",
    locality: "Nidasoshi",
    city: "Belagavi",
  },
  {
    code: "E112",
    name: "Sahyadri College of Engineering and Management",
    locality: "Adyar",
    city: "Mangaluru",
  },
  {
    code: "E113",
    name: "Sai Vidya Institute of Technology",
    locality: "Rajan Kunte",
    city: "Bengaluru",
  },
  {
    code: "E114",
    name: "Sambhram Institute of Technology",
    locality: "Jalahalli East",
    city: "Bengaluru",
  },
  {
    code: "E116",
    name: "Sapthagiri NPS University",
    locality: "Hesarghatta Main Road",
    city: "Bengaluru",
  },
  {
    code: "E117",
    name: "SDM College of Engineering and Technology, Tulu Minority",
    locality: "Kalaghatagi",
    city: "Dharwad",
  },
  {
    code: "E118",
    name: "SDM Institute of Technology, Tulu Minority",
    locality: "Ujjire",
    city: "Dakshina Kannada",
  },
  {
    code: "E119",
    name: "SECAB Institute of Engineering andTechnology",
    locality: "Nauraspur-Bagalkot Road",
    city: "Vijayapura",
  },
  {
    code: "E121",
    name: "Sri Sairam College of Engineering",
    locality: "Anekal",
    city: "Bengaluru",
  },
  {
    code: "E122",
    name: "Shree Devi Institute of Technology",
    locality: "Kenjar",
    city: "Mangaluru",
  },
  {
    code: "E123",
    name: "Shri Madhwa Vadiraja Institute of Technology and Management",
    locality: "Bantakal",
    city: "Udupi",
  },
  {
    code: "E124",
    name: "Shridevi Institute of Engineering and Technology",
    locality: "Sira Road",
    city: "Tumakuru",
  },
  {
    code: "E125",
    name: "Siddaganga Institute of Technology",
    locality: "B H Road",
    city: "Tumakuru",
    podcast: {
      youtubeId: "RGzq0SRDmvc",
      title: "SIT Tumkur Student Review",
    },
  },
  {
    code: "E126",
    name: "Sir M.Visvesvaraya Institute of Technology",
    locality: "Yelahanka",
    city: "Bengaluru",
  },
  {
    code: "E127",
    name: "SJM Institute of Technology",
    locality: "NH 4 Bye-pass",
    city: "Chitradurga",
  },
  {
    code: "E128",
    name: "Smt. Kamala and Sri Venkappa M. Agadi College of Engineering and Technology",
    locality: "Laxmeswar",
    city: "Gadag",
  },
  {
    code: "E132",
    name: "Sri Krishna Institute of Technology",
    locality: "Chikkabanavara",
    city: "Bengaluru",
  },
  {
    code: "E136",
    name: "Sri Taralabalu Jagadguru Institute of Technology",
    locality: "Haveri Dist.",
    city: "Ranebennur",
  },
  {
    code: "E137",
    name: "Sri Venkateshwara College of Engineering",
    locality: "KIAL Road",
    city: "Bengaluru",
  },
  {
    code: "E138",
    name: "Srinivas Institute of Technology",
    locality: "Hampankatta",
    city: "Mangaluru",
  },
  {
    code: "E141",
    name: "T. John Institute of Technology",
    locality: "Bannerghatta Road",
    city: "Bengaluru",
  },
  {
    code: "E142",
    name: "The National Institute of Engineering South Campus",
    locality: "Mananthavady Road",
    city: "Mysuru",
    podcast: {
      youtubeId: "YYxT7kbPbow",
      title: "NIE Mysore Review",
    },
  },
  {
    code: "E143",
    name: "Tontadarya College of Engineering",
    locality: "Mundaragi Road",
    city: "Gadag",
  },
  {
    code: "E144",
    name: "Veerappa Nisty Engineering College",
    locality: "Shorapur",
    city: "Yadgir",
  },
  {
    code: "E145",
    name: "Vemana Institute of Technology",
    locality: "Koramangala",
    city: "Bengaluru",
  },
  {
    code: "E146",
    name: "Vidya Vikas Institute of Engineering and Technology",
    locality: "Alnahally",
    city: "Mysuru",
  },
  {
    code: "E147",
    name: "Vidyavardhaka College of Engineering",
    locality: "Gokulam",
    city: "Mysuru",
  },
  {
    code: "E148",
    name: "Vivekananda College of Engineering and Technology",
    locality: "Puttur",
    city: "Dakshin Kannada",
  },
  {
    code: "E152",
    name: "ATME College of Engineering",
    locality: "Bannur Road",
    city: "Mysuru",
  },
  {
    code: "E156",
    name: "Jyothy Institute of Technology",
    locality: "Tathguni",
    city: "Bengaluru",
  },
  {
    code: "E158",
    name: "Shetty Institute of Technology",
    locality: "Gulbarga Shahabad Road",
    city: "Kalaburagi",
  },
  {
    code: "E159",
    name: "Lingaraj Appa Engineering",
    locality: "Gornalli",
    city: "Bidar",
  },
  {
    code: "E161",
    name: "Cambridge Institute of Technology North Campus",
    locality: "Kundana",
    city: "Bengaluru",
  },
  {
    code: "E164",
    name: "Reva University",
    locality: "Yelahanka",
    city: "Bengaluru",
    podcast: {
      youtubeId: "d-ER1-peQ5s",
      title: "REVA University Bangalore Honest Review",
    },
  },
  {
    code: "E165",
    name: "Alliance College of Engineering and Design. Alliance University",
    locality: "Anekal",
    city: "Bengaluru",
  },
  {
    code: "E171",
    name: "GITAM Deemed to be University",
    locality: "Dodaballapur taluk",
    city: "Bengaluru",
  },
  {
    code: "E172",
    name: "Mysore College of Engineering and Management",
    locality: "Chikkahalli",
    city: "Mysuru",
  },
  {
    code: "E173",
    name: "Presidency University",
    locality: "Yelahanka",
    city: "Bengaluru",
  },
  {
    code: "E183",
    name: "Jain Institute of Technology",
    locality: "Avaragere Village",
    city: "Davangere",
  },
  {
    code: "E187",
    name: "CMR University",
    locality: "Bagalur-Chagalatti",
    city: "Bengaluru",
  },
  {
    code: "E191",
    name: "Sir M V School Of Architecture",
    locality: "Yelahanka",
    city: "Bengaluru",
  },
  {
    code: "E194",
    name: "Jain College of Engineering and Technology",
    locality: "Unkal",
    city: "Hubballi",
  },
  {
    code: "E195",
    name: "Navkis College of Engineering",
    locality: "Kandali NH75",
    city: "Hassan",
  },
  {
    code: "E197",
    name: "M.S. Ramaiah University of Applied Sciences",
    locality: "MSR Nagar",
    city: "Bengaluru",
  },
  {
    code: "E198",
    name: "R V Institute of Technology and Management",
    locality: "J P Nagar",
    city: "Bengaluru",
  },
  {
    code: "E199",
    name: "Biluru Gurubasava Mahaswamiji Institute of Technology",
    locality: "Mudhol",
    city: "Bagalkot",
  },
  {
    code: "E201",
    name: "G Madegowda Institute of Technology",
    locality: "Maddur",
    city: "Mandya District",
  },
  {
    code: "E202",
    name: "C Byregowda Insitute of Technology",
    locality: "Thoradevandahalli",
    city: "Kolar",
  },
  {
    code: "E203",
    name: "Amruta Institute of Engineering and Management Science",
    locality: "Bidadi, Ramnagar Taluk",
    city: "Bengaluru Rural",
  },
  {
    code: "E204",
    name: "H.K.E. Societys Sir M. Visvesvaraya College of Engineering",
    locality: "Yermarus Camp",
    city: "Raichur",
  },
  {
    code: "E205",
    name: "Vijaya Vittala Institution of Technology",
    locality: "Kothanur",
    city: "Bengaluru",
  },
  {
    code: "E206",
    name: "Cauvery Institute Of Technology",
    locality: "Sundahalli",
    city: "Mandya",
  },
  {
    code: "E207",
    name: "BGS College of Engineering and Technology",
    locality: "Mahalaxmipuram",
    city: "Bengaluru",
  },
  {
    code: "E208",
    name: "A.G.M Rural College of Engineering and Technology",
    locality: "Varur",
    city: "Hubballi",
  },
  {
    code: "E209",
    name: "Aditya College of Engineering and Technology",
    locality: "Yelahanka",
    city: "Bengaluru",
  },
  {
    code: "E211",
    name: "East West College of Engineering",
    locality: "Yelahanka",
    city: "Bengaluru",
  },
  {
    code: "E212",
    name: "Seshadripuram Institute of Technology",
    locality: "Jaipura Hobli",
    city: "Mysuru",
  },
  {
    code: "E214",
    name: "Sri Siddhartha School of Engineering",
    locality: "Near Kyathsandra Toll Gate",
    city: "Tumkur",
  },
  {
    code: "E215",
    name: "Cauvery College of Engineering",
    locality: "KBL Layout",
    city: "Mysuru",
  },
  {
    code: "E216",
    name: "New Ebenezer Institute of Technology",
    locality: "Kothanur",
    city: "Bangalore",
  },
  {
    code: "E217",
    name: "Harsha Institute of Technology",
    locality: "Nelamangala Taluk",
    city: "Bangalore Rural",
  },
];
