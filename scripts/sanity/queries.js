// ================================================================
// SANITY GROQ QUERIES
// Fetches published content with exact field projections
// ================================================================

export const PROFILE_QUERY = `
  *[_type == "profile" && _id == "profile"][0]{
    name,
    credential,
    designation,
    yearsExperience,
    heroDescriptionLine1,
    heroDescriptionLine2,
    currentInstitution,
    emailPrimary,
    emailSecondary,
    phone,
    address,
    additionalRoles,
    professionalMemberships,
    "photoUrl": profilePhoto.asset->url
  }
`;

export const EXPERIENCE_QUERY = `
  *[_type == "experience"] | order(order asc, startYear desc){
    _id,
    role,
    organization,
    startYear,
    endYear,
    isCurrent,
    order
  }
`;

export const EDUCATION_QUERY = `
  *[_type == "education"] | order(order asc){
    _id,
    degree,
    institution,
    year,
    thesis,
    order
  }
`;

export const PUBLICATIONS_QUERY = `
  *[_type == "publication"] | order(order asc, year desc){
    _id,
    title,
    authors,
    venue,
    publicationType,
    year,
    doi,
    codeNumber,
    featured,
    externalLink,
    "pdfUrl": pdfFile.asset->url
  }
`;

export const TALKS_QUERY = `
  *[_type == "talk"] | order(year desc, order asc){
    _id,
    title,
    venue,
    dateString,
    year,
    featured,
    order
  }
`;

export const AWARDS_QUERY = `
  *[_type == "award"] | order(order asc){
    _id,
    title,
    organization,
    year,
    description,
    "certificateUrl": certificateFile.asset->url
  }
`;

export const SKILLS_QUERY = `
  *[_type == "skillCategory"] | order(order asc){
    _id,
    category,
    skills,
    order
  }
`;

export const SOCIAL_LINKS_QUERY = `
  *[_type == "socialLink" && visible == true] | order(order asc){
    _id,
    platform,
    url,
    icon
  }
`;

export const SCHOLAR_STATS_QUERY = `
  *[_type == "scholarStats" && _id == "scholarStats"][0]{
    citations,
    hIndex,
    i10Index,
    sciePapersCount,
    ieeeConferencesCount,
    lastUpdated
  }
`;
