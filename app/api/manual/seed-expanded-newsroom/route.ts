import { NextRequest, NextResponse } from "next/server";
import { generateAndUploadImage } from "@/lib/image";
import { findOfficialYoutubeVideo } from "@/lib/youtube";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

type SeedPost = {
  id: string;
  slug: string;
  title: string;
  dek: string;
  summary: string;
  body: string;
  category: string;
  subcategory: string;
  region: string;
  author_name: string;
  author_title: string;
  reading_time: number;
  source_name: string;
  source_url: string;
  image_prompt: string;
  image_url: string | null;
  image_alt: string;
  video_url: string | null;
  video_embed_url: string | null;
  video_source_name: string | null;
  video_title: string | null;
  is_featured: boolean;
  published_at: string;
  video_target?: boolean;
};

function isAuthorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 72);
}

function uniqueSlug(title: string, id: string) {
  const suffix = id.replace(/[^a-z0-9-]/gi, "").slice(-10);
  return `${slugify(title)}-${suffix}`;
}

async function supabaseFetch(path: string, init?: RequestInit) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing Supabase environment variables.");
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res;
}

async function deleteExpandedSeedPosts() {
  await supabaseFetch("posts?id=like.seed-v7-*", {
    method: "DELETE",
    headers: { Prefer: "return=minimal" },
  });
}

const seedStories = [
  {
    "id": "seed-v7-national-warehouse-fire-001",
    "title": "Texas Warehouse Fire Investigated as Suspected Arson",
    "dek": "Authorities are examining whether a major warehouse fire in Texas may have been intentionally set.",
    "summary": "A large warehouse fire in Texas is under investigation as suspected arson after early indicators raised concerns that the blaze may have been intentionally set.",
    "body": "A major fire tore through a warehouse facility in Texas, sending thick smoke above the industrial site and drawing a large emergency response from firefighters, police and investigators.\n\nAuthorities said the fire caused significant structural damage and forced crews to secure the surrounding area while they worked to contain the blaze. Investigators are examining whether the fire may have been intentionally set.\n\nOfficials have not announced a final determination. The review is expected to include burn patterns, possible entry points, surveillance footage if available and witness statements from workers and nearby residents.\n\nFire crews remained on site to monitor hot spots and prevent the fire from spreading to nearby properties. Local officials urged residents to avoid the area while emergency teams continued recovery and documentation work.\n\nInvestigators said additional updates would be released once the origin and cause of the fire are confirmed.",
    "category": "national",
    "subcategory": "Public Safety",
    "author_name": "Daniel Reyes",
    "author_title": "National Affairs Reporter",
    "reading_time": 4,
    "image_alt": "Firefighters respond from a safe distance to a warehouse fire at an industrial site.",
    "image_prompt": "Ultra-realistic premium American digital newspaper photo illustration. Realistic lighting, realistic lens perspective, realistic human anatomy, grounded documentary composition. No text overlays, no logos, no watermarks, no surreal effects, no duplicated people, no impossible poses. The image must match the article topic exactly. Nighttime Texas industrial warehouse fire. Flames and smoke come from the warehouse roofline, windows and loading bay only. Firefighters stand at a safe operational distance behind police tape, emergency vehicles with realistic red and blue lights, wet pavement, dark smoke, industrial surroundings. No person inside flames, no person touching fire, no fire coming from the ground, no lava, no giant explosion, no injuries.",
    "is_featured": true,
    "video_target": true,
    "source_name": "Editorial desk",
    "source_url": "https://global-news-ai-site.vercel.app"
  },
  {
    "id": "seed-v7-national-airport-screening-001",
    "title": "Airports Prepare for a Heavier Summer Travel Push",
    "dek": "Transportation officials are preparing for longer lines, fuller terminals and more pressure on airport staffing.",
    "summary": "Airport operators are preparing for a busy summer travel season as passenger volume, staffing needs and weather disruptions remain key concerns.",
    "body": "Airport officials across the United States are preparing for a heavier summer travel push as airlines, security teams and terminal operators brace for crowded weekends.\n\nThe planning effort is focused on staffing, screening capacity, baggage handling and communication with passengers during weather delays. Travel analysts say the strongest pressure points often come when high passenger volume overlaps with storms or airline scheduling issues.\n\nOfficials are urging travelers to arrive early, monitor airline alerts and prepare for full flights during peak departure periods.",
    "category": "national",
    "subcategory": "Transportation",
    "author_name": "Grace Holloway",
    "author_title": "Transportation Reporter",
    "reading_time": 2,
    "image_alt": "Travelers move through a busy American airport terminal.",
    "image_prompt": "Ultra-realistic premium American digital newspaper photo illustration. Realistic lighting, realistic lens perspective, realistic human anatomy, grounded documentary composition. No text overlays, no logos, no watermarks, no surreal effects, no duplicated people, no impossible poses. The image must match the article topic exactly. Busy American airport terminal during summer travel, travelers with luggage, security line in the distance, realistic indoor lighting, no readable airline logos, no panic.",
    "is_featured": false,
    "video_target": false,
    "source_name": "Editorial desk",
    "source_url": "https://global-news-ai-site.vercel.app"
  },
  {
    "id": "seed-v7-national-schools-security-001",
    "title": "School Districts Review Safety Plans Before the Next Term",
    "dek": "District leaders are updating emergency protocols and communication systems before the next academic cycle.",
    "summary": "School districts are reviewing safety plans, training procedures and parent communication systems ahead of the next term.",
    "body": "School districts are reviewing safety plans before the next academic cycle, with administrators focusing on emergency communication, staff training and coordination with local responders.\n\nThe review process often includes updated contact systems, reunification plans, campus access policies and tabletop drills. Officials say the goal is to prepare without creating unnecessary fear for students and families.\n\nParent groups are also asking districts to explain how alerts are sent, how decisions are made during emergencies and what families should expect if a campus is placed under a safety protocol.",
    "category": "national",
    "subcategory": "Education",
    "author_name": "Olivia Bennett",
    "author_title": "National Education Reporter",
    "reading_time": 3,
    "image_alt": "A quiet American school hallway during safety planning.",
    "image_prompt": "Ultra-realistic premium American digital newspaper photo illustration. Realistic lighting, realistic lens perspective, realistic human anatomy, grounded documentary composition. No text overlays, no logos, no watermarks, no surreal effects, no duplicated people, no impossible poses. The image must match the article topic exactly. Quiet American public school hallway after hours, administrators reviewing documents in the distance, calm safety planning mood, realistic fluorescent lighting, no children in distress, no weapons, no logos.",
    "is_featured": false,
    "video_target": false,
    "source_name": "Editorial desk",
    "source_url": "https://global-news-ai-site.vercel.app"
  },
  {
    "id": "seed-v7-politics-white-house-border-001",
    "title": "White House Signals New Push on Border Security Talks",
    "dek": "Officials say negotiations remain active as border security stays at the center of Washington’s agenda.",
    "summary": "The White House said officials are continuing discussions with congressional leaders as border security negotiations remain a central issue in Washington.",
    "body": "White House officials said border security remains a major focus as negotiations continue with lawmakers on a broader legislative package.\n\nAdministration officials did not announce a final agreement, but described the talks as active and high priority. The issue remains politically sensitive, with both parties seeking to shape the debate around enforcement, asylum processing and federal resources.\n\nNegotiators are expected to continue working through funding levels, operational authority and the political language surrounding any eventual deal.",
    "category": "politics",
    "subcategory": "White House",
    "author_name": "Olivia Bennett",
    "author_title": "Politics Correspondent",
    "reading_time": 3,
    "image_alt": "Reporters outside the White House during a political news cycle.",
    "image_prompt": "Ultra-realistic premium American digital newspaper photo illustration. Realistic lighting, realistic lens perspective, realistic human anatomy, grounded documentary composition. No text overlays, no logos, no watermarks, no surreal effects, no duplicated people, no impossible poses. The image must match the article topic exactly. White House exterior in Washington, D.C. with reporters and cameras in the foreground, neutral daylight, restrained political newsroom atmosphere, no dramatic protest scene, no fake signs, no readable text.",
    "is_featured": false,
    "video_target": true,
    "source_name": "Editorial desk",
    "source_url": "https://global-news-ai-site.vercel.app"
  },
  {
    "id": "seed-v7-politics-state-races-001",
    "title": "State Races Draw Fresh Attention as Campaign Spending Rises",
    "dek": "Political groups are putting more money into state-level contests with national implications.",
    "summary": "State-level races are drawing new attention as outside spending increases and local contests take on broader political meaning.",
    "body": "State-level political contests are drawing new national attention as outside groups increase spending and local races become testing grounds for broader party strategy.\n\nCampaign officials say the focus is not only on top-line races but also on legislative seats, judicial contests and ballot measures that can shape policy for years.\n\nAnalysts say voters may see more advertising, more national messaging and more targeted digital outreach as campaigns compete for attention.",
    "category": "politics",
    "subcategory": "Campaigns",
    "author_name": "Daniel Reyes",
    "author_title": "Political Reporter",
    "reading_time": 3,
    "image_alt": "Campaign signs and a quiet polling location in an American town.",
    "image_prompt": "Ultra-realistic premium American digital newspaper photo illustration. Realistic lighting, realistic lens perspective, realistic human anatomy, grounded documentary composition. No text overlays, no logos, no watermarks, no surreal effects, no duplicated people, no impossible poses. The image must match the article topic exactly. American polling place exterior and campaign signs near a sidewalk, late afternoon light, local politics mood, no readable candidate names, no crowds, realistic documentary style.",
    "is_featured": false,
    "video_target": false,
    "source_name": "Editorial desk",
    "source_url": "https://global-news-ai-site.vercel.app"
  },
  {
    "id": "seed-v7-politics-congress-budget-001",
    "title": "Congressional Budget Talks Move Into a More Difficult Phase",
    "dek": "Lawmakers are preparing for harder negotiations as funding deadlines approach.",
    "summary": "Congressional budget talks are moving into a more difficult phase as lawmakers face pressure to resolve spending disputes before deadlines.",
    "body": "Budget talks on Capitol Hill are moving into a more difficult phase as lawmakers work through spending priorities, agency funding levels and competing demands from party leaders.\n\nThe negotiations are expected to intensify as deadlines approach. Staff-level talks are focused on identifying areas of agreement while lawmakers publicly emphasize their preferred priorities.\n\nThe outcome could affect federal agencies, local programs and the political debate over fiscal responsibility heading into the next campaign cycle.",
    "category": "politics",
    "subcategory": "Congress",
    "author_name": "Maya Collins",
    "author_title": "Congressional Correspondent",
    "reading_time": 3,
    "image_alt": "A quiet corridor inside a congressional office building.",
    "image_prompt": "Ultra-realistic premium American digital newspaper photo illustration. Realistic lighting, realistic lens perspective, realistic human anatomy, grounded documentary composition. No text overlays, no logos, no watermarks, no surreal effects, no duplicated people, no impossible poses. The image must match the article topic exactly. Quiet congressional office hallway in Washington, staffers with folders, warm institutional lighting, budget negotiation mood, no readable documents, no logos, realistic political journalism style.",
    "is_featured": false,
    "video_target": false,
    "source_name": "Editorial desk",
    "source_url": "https://global-news-ai-site.vercel.app"
  },
  {
    "id": "seed-v7-business-retail-spending-001",
    "title": "U.S. Retailers Watch Consumer Spending for Signs of Summer Slowdown",
    "dek": "Retailers and analysts are watching whether shoppers become more selective heading into the summer season.",
    "summary": "Major retailers are closely monitoring consumer demand as analysts look for early signs of a summer spending slowdown.",
    "body": "U.S. retailers and market analysts are watching consumer behavior for signs that household budgets may be tightening heading into the summer season.\n\nRecent commentary from the retail sector suggests shoppers remain active, though increasingly selective with discretionary purchases. The strongest brands are trying to protect margins while avoiding price fatigue among customers.\n\nEconomists say consumer confidence, borrowing costs and pricing pressure remain key variables. Investors are also watching earnings guidance for clues about how companies expect demand to shift in the months ahead.\n\nThe next few weeks could reveal whether the consumer remains resilient or starts to pull back more sharply from non-essential purchases.",
    "category": "business",
    "subcategory": "Economy",
    "author_name": "Marcus Hill",
    "author_title": "Business Reporter",
    "reading_time": 4,
    "image_alt": "Shoppers walk through a U.S. retail district.",
    "image_prompt": "Ultra-realistic premium American digital newspaper photo illustration. Realistic lighting, realistic lens perspective, realistic human anatomy, grounded documentary composition. No text overlays, no logos, no watermarks, no surreal effects, no duplicated people, no impossible poses. The image must match the article topic exactly. American retail shopping district in soft daylight, shoppers walking with bags, storefronts without readable brands, realistic city atmosphere, subtle business news tone.",
    "is_featured": false,
    "video_target": true,
    "source_name": "Editorial desk",
    "source_url": "https://global-news-ai-site.vercel.app"
  },
  {
    "id": "seed-v7-business-small-business-001",
    "title": "Small Businesses Adjust Hiring Plans as Costs Stay Elevated",
    "dek": "Owners are balancing labor needs against rent, insurance and supply costs.",
    "summary": "Small businesses are adjusting hiring plans as elevated operating costs continue to shape decisions.",
    "body": "Small business owners are adjusting hiring plans as elevated operating costs continue to shape decisions across restaurants, retail shops and local service companies.\n\nOwners say rent, insurance, supplies and wages remain central pressure points. Many are trying to maintain service quality while limiting new commitments that could strain cash flow.\n\nEconomists say the small business sector remains an important indicator of local economic health because it reflects both consumer demand and the everyday cost of operating.",
    "category": "business",
    "subcategory": "Small Business",
    "author_name": "Ava Morgan",
    "author_title": "Economy Reporter",
    "reading_time": 3,
    "image_alt": "A small business owner reviews paperwork in a neighborhood shop.",
    "image_prompt": "Ultra-realistic premium American digital newspaper photo illustration. Realistic lighting, realistic lens perspective, realistic human anatomy, grounded documentary composition. No text overlays, no logos, no watermarks, no surreal effects, no duplicated people, no impossible poses. The image must match the article topic exactly. Neighborhood small business interior, owner reviewing paperwork near counter, shelves and soft morning light, realistic local economy photo, no logos, no readable signs.",
    "is_featured": false,
    "video_target": false,
    "source_name": "Editorial desk",
    "source_url": "https://global-news-ai-site.vercel.app"
  },
  {
    "id": "seed-v7-business-markets-rate-watch-001",
    "title": "Markets Stay Focused on Rate Signals and Corporate Guidance",
    "dek": "Investors are watching whether companies sound more cautious about demand.",
    "summary": "Markets remain focused on interest-rate signals and corporate guidance as investors look for signs of changing demand.",
    "body": "Investors are watching interest-rate signals and corporate guidance for clues about how the economy is absorbing tighter financial conditions.\n\nMarket strategists say earnings commentary is becoming as important as the numbers themselves. Executives who point to slower demand, rising costs or cautious customers can quickly shift sentiment.\n\nThe next round of corporate updates could help clarify whether recent market strength is broadening or relying on a smaller group of companies.",
    "category": "business",
    "subcategory": "Markets",
    "author_name": "Marcus Hill",
    "author_title": "Markets Reporter",
    "reading_time": 3,
    "image_alt": "Financial professionals watch market data in an office.",
    "image_prompt": "Ultra-realistic premium American digital newspaper photo illustration. Realistic lighting, realistic lens perspective, realistic human anatomy, grounded documentary composition. No text overlays, no logos, no watermarks, no surreal effects, no duplicated people, no impossible poses. The image must match the article topic exactly. Financial office with analysts watching abstract market charts on screens, no readable tickers, realistic business lighting, calm professional atmosphere.",
    "is_featured": false,
    "video_target": false,
    "source_name": "Editorial desk",
    "source_url": "https://global-news-ai-site.vercel.app"
  },
  {
    "id": "seed-v7-technology-ai-rollouts-001",
    "title": "AI Product Race Intensifies as Tech Firms Expand Consumer Rollouts",
    "dek": "Technology companies are moving faster to push AI tools into consumer and enterprise products.",
    "summary": "Technology companies continue to accelerate AI product launches as competition intensifies across consumer and enterprise markets.",
    "body": "The AI competition among major technology companies remains intense, with firms pushing new tools and integrations across search, productivity software and mobile devices.\n\nAnalysts say the pace of deployment reflects both commercial pressure and rising expectations from users. The focus is shifting from early demonstrations to products that people can use every day without technical friction.\n\nIndustry observers say the next phase will be measured by reliability, user trust, cost control and whether companies can make AI features feel genuinely useful rather than decorative.\n\nEnterprises are also watching security, compliance and data-control questions as they decide how quickly to roll out AI tools internally.",
    "category": "technology",
    "subcategory": "Artificial Intelligence",
    "author_name": "Emily Parker",
    "author_title": "Technology Reporter",
    "reading_time": 4,
    "image_alt": "A modern technology workspace with abstract AI interface visuals.",
    "image_prompt": "Ultra-realistic premium American digital newspaper photo illustration. Realistic lighting, realistic lens perspective, realistic human anatomy, grounded documentary composition. No text overlays, no logos, no watermarks, no surreal effects, no duplicated people, no impossible poses. The image must match the article topic exactly. Modern technology workspace, monitors with abstract non-readable AI interface shapes, editors and engineers in background, realistic office lighting, no copyrighted interface, no text.",
    "is_featured": false,
    "video_target": true,
    "source_name": "Editorial desk",
    "source_url": "https://global-news-ai-site.vercel.app"
  },
  {
    "id": "seed-v7-technology-cybersecurity-001",
    "title": "Cybersecurity Teams Prepare for a More Complex Threat Landscape",
    "dek": "Companies are reassessing identity systems, vendor access and employee training.",
    "summary": "Cybersecurity teams are preparing for more complex threats by reassessing access controls, vendor risk and employee training.",
    "body": "Cybersecurity teams are preparing for a more complex threat landscape as companies reassess identity systems, vendor access and employee training.\n\nSecurity leaders say the weakest points often emerge where legacy systems meet modern cloud tools. Attackers increasingly look for misconfigured access, weak authentication and employees under time pressure.\n\nCompanies are responding with stronger identity controls, tabletop exercises and more careful review of third-party software connections.",
    "category": "technology",
    "subcategory": "Cybersecurity",
    "author_name": "Noah Carter",
    "author_title": "Cybersecurity Correspondent",
    "reading_time": 3,
    "image_alt": "A cybersecurity operations room with analysts monitoring systems.",
    "image_prompt": "Ultra-realistic premium American digital newspaper photo illustration. Realistic lighting, realistic lens perspective, realistic human anatomy, grounded documentary composition. No text overlays, no logos, no watermarks, no surreal effects, no duplicated people, no impossible poses. The image must match the article topic exactly. Cybersecurity operations room, analysts reviewing abstract security dashboards, low-light office, realistic, no readable code, no hacker hoodie cliché, no logos.",
    "is_featured": false,
    "video_target": false,
    "source_name": "Editorial desk",
    "source_url": "https://global-news-ai-site.vercel.app"
  },
  {
    "id": "seed-v7-technology-devices-001",
    "title": "Device Makers Lean on Software Features to Drive Upgrades",
    "dek": "Hardware companies are using software and AI features to make new devices feel more useful.",
    "summary": "Device makers are leaning on software features, AI tools and ecosystem services to encourage upgrades.",
    "body": "Device makers are leaning more heavily on software features to drive upgrade cycles as hardware improvements become harder for everyday buyers to distinguish.\n\nAnalysts say AI tools, camera processing, battery management and cross-device services are becoming central selling points. The challenge is convincing consumers that the improvements are worth the cost.\n\nRetailers expect software demonstrations to play a bigger role in how devices are marketed this year.",
    "category": "technology",
    "subcategory": "Devices",
    "author_name": "Emily Parker",
    "author_title": "Consumer Tech Reporter",
    "reading_time": 3,
    "image_alt": "A consumer electronics display with modern devices.",
    "image_prompt": "Ultra-realistic premium American digital newspaper photo illustration. Realistic lighting, realistic lens perspective, realistic human anatomy, grounded documentary composition. No text overlays, no logos, no watermarks, no surreal effects, no duplicated people, no impossible poses. The image must match the article topic exactly. Modern consumer electronics display table with laptops and phones, soft retail lighting, abstract screens, no logos, no readable UI, realistic technology section photo.",
    "is_featured": false,
    "video_target": false,
    "source_name": "Editorial desk",
    "source_url": "https://global-news-ai-site.vercel.app"
  },
  {
    "id": "seed-v7-world-health-alerts-001",
    "title": "Global Health Alerts Put U.S. Preparedness Back in Focus",
    "dek": "Officials are monitoring international alerts while reviewing implications for travel guidance and readiness.",
    "summary": "Public health officials are tracking disease alerts abroad and evaluating any implications for U.S. preparedness and traveler guidance.",
    "body": "Health authorities are monitoring international public health alerts and reviewing updated guidance related to travel, screening and preparedness.\n\nOfficials emphasized surveillance and timely communication while avoiding alarm. Experts say public confidence depends on clear messaging, transparency and a balanced understanding of risk.\n\nAgencies are expected to continue monitoring developments and adjusting recommendations as needed.",
    "category": "world",
    "subcategory": "Health",
    "author_name": "Nathan Brooks",
    "author_title": "World News Correspondent",
    "reading_time": 3,
    "image_alt": "Public health officials working in an operations center.",
    "image_prompt": "Ultra-realistic premium American digital newspaper photo illustration. Realistic lighting, realistic lens perspective, realistic human anatomy, grounded documentary composition. No text overlays, no logos, no watermarks, no surreal effects, no duplicated people, no impossible poses. The image must match the article topic exactly. Public health operations center, medical staff reviewing screens and documents, calm institutional setting, realistic lighting, no panic, no graphic imagery, no disease particles, no hospital disaster.",
    "is_featured": false,
    "video_target": false,
    "source_name": "Editorial desk",
    "source_url": "https://global-news-ai-site.vercel.app"
  },
  {
    "id": "seed-v7-world-diplomacy-talks-001",
    "title": "Diplomats Search for Openings as Regional Tensions Rise",
    "dek": "Officials are working through back channels as allies look for ways to prevent escalation.",
    "summary": "Diplomats are searching for openings to reduce regional tensions as allies and international organizations push for restraint.",
    "body": "Diplomats are searching for openings to reduce regional tensions as allies and international organizations push for restraint.\n\nOfficials involved in the discussions say back-channel communication remains important when public positions harden. The goal is often less about immediate agreement and more about preventing a rapid escalation that narrows options.\n\nForeign policy analysts say the coming days could be shaped by whether leaders can preserve diplomatic space while responding to domestic political pressure.",
    "category": "world",
    "subcategory": "Diplomacy",
    "author_name": "Nathan Brooks",
    "author_title": "Foreign Affairs Reporter",
    "reading_time": 3,
    "image_alt": "Diplomats walk through an international conference hallway.",
    "image_prompt": "Ultra-realistic premium American digital newspaper photo illustration. Realistic lighting, realistic lens perspective, realistic human anatomy, grounded documentary composition. No text overlays, no logos, no watermarks, no surreal effects, no duplicated people, no impossible poses. The image must match the article topic exactly. International conference hallway, diplomats and aides walking with folders, neutral institutional lighting, restrained diplomatic news mood, no flags with readable text, no logos.",
    "is_featured": false,
    "video_target": true,
    "source_name": "Editorial desk",
    "source_url": "https://global-news-ai-site.vercel.app"
  },
  {
    "id": "seed-v7-world-global-supply-chain-001",
    "title": "Global Supply Chains Brace for Shipping and Weather Disruptions",
    "dek": "Logistics teams are watching port delays, storm risks and rising uncertainty in freight planning.",
    "summary": "Global supply chain teams are monitoring shipping conditions, weather disruptions and freight uncertainty.",
    "body": "Global supply chain teams are monitoring shipping conditions, weather disruptions and freight uncertainty as companies prepare for possible delays.\n\nLogistics managers say the most difficult disruptions are often the ones that compound: a port bottleneck, a weather event and a sudden spike in demand can quickly strain schedules.\n\nCompanies are reviewing inventory buffers, alternative routes and communication plans with suppliers.",
    "category": "world",
    "subcategory": "Global Economy",
    "author_name": "Marcus Hill",
    "author_title": "Global Business Reporter",
    "reading_time": 3,
    "image_alt": "Shipping containers and cranes at a busy port.",
    "image_prompt": "Ultra-realistic premium American digital newspaper photo illustration. Realistic lighting, realistic lens perspective, realistic human anatomy, grounded documentary composition. No text overlays, no logos, no watermarks, no surreal effects, no duplicated people, no impossible poses. The image must match the article topic exactly. Busy shipping port with containers and cranes, overcast daylight, logistics atmosphere, realistic scale, no readable shipping company logos.",
    "is_featured": false,
    "video_target": false,
    "source_name": "Editorial desk",
    "source_url": "https://global-news-ai-site.vercel.app"
  },
  {
    "id": "seed-v7-health-hospital-staffing-001",
    "title": "Hospitals Reassess Staffing Plans Ahead of Busy Summer Period",
    "dek": "Health systems are reviewing staffing and emergency planning as summer travel and heat risks increase.",
    "summary": "Hospitals are reviewing staffing plans and emergency readiness ahead of the summer period, when travel, heat and seasonal demand can increase pressure on care teams.",
    "body": "Hospitals and health systems are reassessing staffing plans as administrators prepare for the busy summer period.\n\nEmergency departments often face shifting pressure from travel, heat-related illness and local surges in demand. Health experts say the focus is on staffing flexibility, patient flow and clear communication with communities.\n\nAdministrators are also reviewing supply readiness and coordination with local emergency teams.",
    "category": "health",
    "subcategory": "Hospitals",
    "author_name": "Sofia Turner",
    "author_title": "Health Reporter",
    "reading_time": 3,
    "image_alt": "Hospital staff prepare a quiet emergency department area.",
    "image_prompt": "Ultra-realistic premium American digital newspaper photo illustration. Realistic lighting, realistic lens perspective, realistic human anatomy, grounded documentary composition. No text overlays, no logos, no watermarks, no surreal effects, no duplicated people, no impossible poses. The image must match the article topic exactly. Quiet American hospital emergency department preparation scene, nurses and clinicians at a desk, clean institutional lighting, realistic staffing environment, no patients in distress, no graphic details, no logos.",
    "is_featured": false,
    "video_target": false,
    "source_name": "Editorial desk",
    "source_url": "https://global-news-ai-site.vercel.app"
  },
  {
    "id": "seed-v7-health-heat-safety-001",
    "title": "Doctors Urge Earlier Heat Precautions as Temperatures Climb",
    "dek": "Clinicians say hydration, shade and checking on vulnerable neighbors matter before heat becomes dangerous.",
    "summary": "Doctors are urging earlier heat precautions as rising temperatures increase risks for older adults, outdoor workers and people with chronic conditions.",
    "body": "Doctors are urging earlier heat precautions as temperatures climb across parts of the country.\n\nClinicians say the most important steps often happen before a heat emergency begins: hydration, shade, limiting outdoor exertion and checking on older adults or neighbors without reliable cooling.\n\nPublic health officials also emphasize that heat risk can build over several days, especially when overnight temperatures remain high.",
    "category": "health",
    "subcategory": "Public Health",
    "author_name": "Sofia Turner",
    "author_title": "Health Reporter",
    "reading_time": 3,
    "image_alt": "A public health worker speaks with residents during a hot day.",
    "image_prompt": "Ultra-realistic premium American digital newspaper photo illustration. Realistic lighting, realistic lens perspective, realistic human anatomy, grounded documentary composition. No text overlays, no logos, no watermarks, no surreal effects, no duplicated people, no impossible poses. The image must match the article topic exactly. Public health worker speaking with residents near a cooling center on a hot day, bottled water on table, realistic summer heat, no distress, no logos, no readable signs.",
    "is_featured": false,
    "video_target": true,
    "source_name": "Editorial desk",
    "source_url": "https://global-news-ai-site.vercel.app"
  },
  {
    "id": "seed-v7-health-primary-care-001",
    "title": "Primary Care Clinics Expand Digital Follow-Up Options",
    "dek": "Clinics are using messaging and virtual check-ins to reduce missed appointments.",
    "summary": "Primary care clinics are expanding digital follow-up tools to reduce missed appointments and improve routine care.",
    "body": "Primary care clinics are expanding digital follow-up options as medical groups look for ways to reduce missed appointments and improve routine care.\n\nClinicians say secure messages, virtual check-ins and appointment reminders can help patients manage chronic conditions without always needing a full office visit.\n\nThe shift also raises questions about workload, privacy and how to make digital care accessible to patients who are less comfortable with technology.",
    "category": "health",
    "subcategory": "Care Access",
    "author_name": "Sofia Turner",
    "author_title": "Health Reporter",
    "reading_time": 3,
    "image_alt": "A primary care clinician reviews a digital patient chart.",
    "image_prompt": "Ultra-realistic premium American digital newspaper photo illustration. Realistic lighting, realistic lens perspective, realistic human anatomy, grounded documentary composition. No text overlays, no logos, no watermarks, no surreal effects, no duplicated people, no impossible poses. The image must match the article topic exactly. Primary care clinic office, clinician reviewing a tablet with abstract chart visuals, calm professional atmosphere, realistic lighting, no readable patient data, no logos.",
    "is_featured": false,
    "video_target": false,
    "source_name": "Editorial desk",
    "source_url": "https://global-news-ai-site.vercel.app"
  },
  {
    "id": "seed-v7-sports-championship-weekend-001",
    "title": "Championship Weekend Draws Heavy Attention from U.S. Sports Fans",
    "dek": "Several major sporting events are driving strong digital interest and live coverage.",
    "summary": "Fans across the country are closely following a busy championship weekend as several major sporting events draw national attention.",
    "body": "A packed sports weekend is drawing broad attention from U.S. fans, with multiple high-profile events generating heavy coverage and online discussion.\n\nBroadcasters and leagues are seeing strong engagement as audiences follow key matchups, results and storylines. Analysts say the convergence of marquee events has helped sustain momentum across the sports news cycle.\n\nDigital platforms are also playing a bigger role as highlights, live reactions and athlete interviews spread quickly after key moments.",
    "category": "sports",
    "subcategory": "Sports News",
    "author_name": "Jason Cole",
    "author_title": "Sports Correspondent",
    "reading_time": 3,
    "image_alt": "Fans fill a U.S. stadium during a major sports event.",
    "image_prompt": "Ultra-realistic premium American digital newspaper photo illustration. Realistic lighting, realistic lens perspective, realistic human anatomy, grounded documentary composition. No text overlays, no logos, no watermarks, no surreal effects, no duplicated people, no impossible poses. The image must match the article topic exactly. U.S. stadium atmosphere at night, fans in stands, field lighting, sideline press area, realistic sports energy, no logos, no readable scoreboard, no distorted faces.",
    "is_featured": false,
    "video_target": true,
    "source_name": "Editorial desk",
    "source_url": "https://global-news-ai-site.vercel.app"
  },
  {
    "id": "seed-v7-sports-athlete-recovery-001",
    "title": "Teams Put More Focus on Recovery as Seasons Stretch Longer",
    "dek": "Coaches and performance staffs are using rest, nutrition and monitoring to protect athletes.",
    "summary": "Professional teams are putting more focus on athlete recovery as travel, training and longer seasons increase physical demands.",
    "body": "Professional teams are putting more focus on athlete recovery as travel, training intensity and longer seasons increase physical demands.\n\nPerformance staffs are using sleep tracking, nutrition planning, strength programs and workload monitoring to help players stay available. Coaches say the goal is not only injury prevention but consistent performance.\n\nThe emphasis reflects a broader shift in sports, where recovery is increasingly treated as part of training rather than a break from it.",
    "category": "sports",
    "subcategory": "Performance",
    "author_name": "Jason Cole",
    "author_title": "Sports Reporter",
    "reading_time": 3,
    "image_alt": "Athletes train in a professional sports facility.",
    "image_prompt": "Ultra-realistic premium American digital newspaper photo illustration. Realistic lighting, realistic lens perspective, realistic human anatomy, grounded documentary composition. No text overlays, no logos, no watermarks, no surreal effects, no duplicated people, no impossible poses. The image must match the article topic exactly. Professional sports training facility, athletes stretching and working with trainers, realistic lighting, no team logos, no readable jerseys, documentary sports journalism style.",
    "is_featured": false,
    "video_target": false,
    "source_name": "Editorial desk",
    "source_url": "https://global-news-ai-site.vercel.app"
  },
  {
    "id": "seed-v7-sports-womens-sports-001",
    "title": "Women’s Sports Continue to Draw Bigger Audiences and Sponsors",
    "dek": "Leagues and broadcasters are adjusting as fan interest keeps rising.",
    "summary": "Women’s sports continue to draw bigger audiences, stronger sponsorship interest and more national media attention.",
    "body": "Women’s sports continue to draw bigger audiences and stronger sponsorship interest as broadcasters, leagues and brands adjust to rising demand.\n\nMedia analysts say the growth is being driven by a mix of star power, better distribution and fans who are more willing to follow athletes across platforms.\n\nThe challenge for leagues is turning attention into durable investment in facilities, pay, broadcast slots and youth development.",
    "category": "sports",
    "subcategory": "Leagues",
    "author_name": "Ava Morgan",
    "author_title": "Sports Business Reporter",
    "reading_time": 3,
    "image_alt": "A women’s sports team warms up before a game.",
    "image_prompt": "Ultra-realistic premium American digital newspaper photo illustration. Realistic lighting, realistic lens perspective, realistic human anatomy, grounded documentary composition. No text overlays, no logos, no watermarks, no surreal effects, no duplicated people, no impossible poses. The image must match the article topic exactly. Women's sports team warming up before a game in a modern arena, fans entering stands, realistic sports lighting, no logos, no readable uniforms, professional journalism style.",
    "is_featured": false,
    "video_target": false,
    "source_name": "Editorial desk",
    "source_url": "https://global-news-ai-site.vercel.app"
  },
  {
    "id": "seed-v7-style-entertainment-strategy-001",
    "title": "Streaming and Box Office Trends Reshape Entertainment Strategy",
    "dek": "Studios and platforms are adjusting as audiences split attention across theaters and streaming.",
    "summary": "Media companies are adjusting entertainment strategies as streaming competition and box office performance continue to evolve.",
    "body": "Entertainment executives are rethinking release strategies as streaming economics and theatrical performance remain under close scrutiny.\n\nIndustry analysts say content investment, franchise reliance and subscriber retention are central concerns across the sector. Audience behavior has become harder to predict, pushing studios and platforms to balance scale with efficiency.\n\nAnalysts expect continued experimentation in release timing, pricing and bundling as companies compete for attention.",
    "category": "style",
    "subcategory": "Entertainment",
    "author_name": "Rachel Kim",
    "author_title": "Culture Reporter",
    "reading_time": 3,
    "image_alt": "A cinema district at night.",
    "image_prompt": "Ultra-realistic premium American digital newspaper photo illustration. Realistic lighting, realistic lens perspective, realistic human anatomy, grounded documentary composition. No text overlays, no logos, no watermarks, no surreal effects, no duplicated people, no impossible poses. The image must match the article topic exactly. American cinema district at night, glowing theater entrance, people walking outside, modern entertainment atmosphere, no readable movie titles, no logos.",
    "is_featured": false,
    "video_target": true,
    "source_name": "Editorial desk",
    "source_url": "https://global-news-ai-site.vercel.app"
  },
  {
    "id": "seed-v7-style-food-trends-001",
    "title": "Restaurants Lean Into Smaller Menus and Faster Service",
    "dek": "Operators are simplifying menus to control costs and improve consistency.",
    "summary": "Restaurants are simplifying menus and streamlining service models as operators manage costs and shifting customer habits.",
    "body": "Restaurants are leaning into smaller menus and faster service models as operators manage costs and shifting customer habits.\n\nIndustry consultants say a more focused menu can reduce waste, speed up kitchen operations and make staffing easier during busy hours. For customers, the result can be a simpler ordering experience.\n\nThe shift is especially visible among casual restaurants trying to balance quality, price and convenience.",
    "category": "style",
    "subcategory": "Food",
    "author_name": "Rachel Kim",
    "author_title": "Lifestyle Reporter",
    "reading_time": 3,
    "image_alt": "A restaurant kitchen preparing orders during service.",
    "image_prompt": "Ultra-realistic premium American digital newspaper photo illustration. Realistic lighting, realistic lens perspective, realistic human anatomy, grounded documentary composition. No text overlays, no logos, no watermarks, no surreal effects, no duplicated people, no impossible poses. The image must match the article topic exactly. Modern restaurant kitchen during service, chefs preparing dishes, realistic warm lighting, no brand logos, no readable menus, lifestyle journalism style.",
    "is_featured": false,
    "video_target": false,
    "source_name": "Editorial desk",
    "source_url": "https://global-news-ai-site.vercel.app"
  },
  {
    "id": "seed-v7-style-fashion-resale-001",
    "title": "Resale Fashion Moves Further Into the Mainstream",
    "dek": "Shoppers are mixing secondhand finds with new purchases as prices and sustainability shape choices.",
    "summary": "Resale fashion is moving further into the mainstream as shoppers mix secondhand pieces with new purchases.",
    "body": "Resale fashion is moving further into the mainstream as shoppers mix secondhand finds with new purchases and pay closer attention to price, quality and sustainability.\n\nRetail analysts say the category has benefited from younger shoppers who treat resale as both a value play and a style choice. Traditional retailers are also experimenting with trade-in and resale partnerships.\n\nThe challenge is maintaining trust around condition, authenticity and delivery experience.",
    "category": "style",
    "subcategory": "Fashion",
    "author_name": "Ava Morgan",
    "author_title": "Style Reporter",
    "reading_time": 3,
    "image_alt": "A curated resale fashion rack in a boutique.",
    "image_prompt": "Ultra-realistic premium American digital newspaper photo illustration. Realistic lighting, realistic lens perspective, realistic human anatomy, grounded documentary composition. No text overlays, no logos, no watermarks, no surreal effects, no duplicated people, no impossible poses. The image must match the article topic exactly. Curated resale fashion boutique, clothing racks, shopper browsing, natural light, realistic lifestyle editorial style, no brand logos, no readable tags.",
    "is_featured": false,
    "video_target": false,
    "source_name": "Editorial desk",
    "source_url": "https://global-news-ai-site.vercel.app"
  },
  {
    "id": "seed-v7-climate-severe-weather-001",
    "title": "Severe Weather Threat Keeps Emergency Teams on Alert Across Several States",
    "dek": "Emergency officials are monitoring storms and preparing for possible local disruptions.",
    "summary": "Emergency officials across several states are monitoring severe weather conditions and preparing for possible local disruptions.",
    "body": "Weather officials and emergency teams remain on alert in several states as shifting conditions raise concerns about storms, heavy rain and localized disruption.\n\nAuthorities urged residents to monitor local forecasts and follow official guidance where needed. Forecasters said conditions can evolve quickly, especially in areas already vulnerable to flooding or wind damage.\n\nEmergency services said preparedness remains the key priority.",
    "category": "climate",
    "subcategory": "Weather",
    "author_name": "Noah Grant",
    "author_title": "Climate Reporter",
    "reading_time": 3,
    "image_alt": "Storm clouds form over an American town.",
    "image_prompt": "Ultra-realistic premium American digital newspaper photo illustration. Realistic lighting, realistic lens perspective, realistic human anatomy, grounded documentary composition. No text overlays, no logos, no watermarks, no surreal effects, no duplicated people, no impossible poses. The image must match the article topic exactly. Storm clouds over a small American town, emergency vehicles parked at a distance, realistic atmospheric lighting, no tornado unless far away, no disaster exaggeration.",
    "is_featured": false,
    "video_target": true,
    "source_name": "Editorial desk",
    "source_url": "https://global-news-ai-site.vercel.app"
  },
  {
    "id": "seed-v7-climate-grid-demand-001",
    "title": "Power Grid Operators Prepare for Higher Cooling Demand",
    "dek": "Utilities are reviewing readiness as warmer weather increases electricity use.",
    "summary": "Power grid operators are preparing for higher cooling demand as warmer weather raises electricity use in several regions.",
    "body": "Power grid operators are preparing for higher cooling demand as warmer weather raises electricity use in several regions.\n\nUtilities are reviewing maintenance schedules, reserve capacity and communication plans for customers during high-demand periods. Energy analysts say the challenge is balancing reliability with affordability.\n\nLonger heat waves can create sustained pressure, especially when overnight temperatures stay elevated and air conditioning use remains high.",
    "category": "climate",
    "subcategory": "Energy",
    "author_name": "Noah Grant",
    "author_title": "Climate and Energy Reporter",
    "reading_time": 3,
    "image_alt": "Power lines at sunset during warm weather.",
    "image_prompt": "Ultra-realistic premium American digital newspaper photo illustration. Realistic lighting, realistic lens perspective, realistic human anatomy, grounded documentary composition. No text overlays, no logos, no watermarks, no surreal effects, no duplicated people, no impossible poses. The image must match the article topic exactly. Power lines and electrical substation at sunset during summer heat, realistic energy infrastructure, warm atmospheric light, no dramatic disaster, no logos.",
    "is_featured": false,
    "video_target": false,
    "source_name": "Editorial desk",
    "source_url": "https://global-news-ai-site.vercel.app"
  },
  {
    "id": "seed-v7-climate-coastal-planning-001",
    "title": "Coastal Cities Revisit Flood Planning as Storm Seasons Shift",
    "dek": "Local officials are reviewing drainage, evacuation routes and infrastructure priorities.",
    "summary": "Coastal cities are revisiting flood planning as changing storm patterns place more pressure on local infrastructure.",
    "body": "Coastal cities are revisiting flood planning as storm patterns place more pressure on local infrastructure.\n\nOfficials are reviewing drainage systems, evacuation routes, pump capacity and communication plans for residents in vulnerable neighborhoods. Urban planners say the work is often expensive but increasingly difficult to delay.\n\nThe most visible projects may involve seawalls and pumps, but officials say smaller neighborhood-level upgrades can also matter during heavy rain.",
    "category": "climate",
    "subcategory": "Resilience",
    "author_name": "Noah Grant",
    "author_title": "Climate Reporter",
    "reading_time": 3,
    "image_alt": "A coastal city waterfront with storm preparation equipment.",
    "image_prompt": "Ultra-realistic premium American digital newspaper photo illustration. Realistic lighting, realistic lens perspective, realistic human anatomy, grounded documentary composition. No text overlays, no logos, no watermarks, no surreal effects, no duplicated people, no impossible poses. The image must match the article topic exactly. Coastal American city waterfront under cloudy sky, workers inspecting flood barriers and drainage infrastructure, realistic planning mood, no disaster flooding, no logos.",
    "is_featured": false,
    "video_target": false,
    "source_name": "Editorial desk",
    "source_url": "https://global-news-ai-site.vercel.app"
  },
  {
    "id": "seed-v7-opinion-institutions-trust-001",
    "title": "Opinion: Trust in Institutions Depends on Clearer Public Communication",
    "dek": "Public confidence is shaped not only by policy, but by whether institutions explain decisions clearly.",
    "summary": "Public confidence in institutions depends on transparency, consistency and whether officials communicate uncertainty honestly.",
    "body": "Institutions often lose public trust not only because of what they decide, but because of how those decisions are explained.\n\nClear communication matters most during moments of uncertainty, when audiences are looking for consistency and honesty. The strongest public messaging does not pretend every answer is settled.\n\nIt explains what is known, what remains under review and when people can expect reliable updates.",
    "category": "opinion",
    "subcategory": "Analysis",
    "author_name": "Editorial Board",
    "author_title": "Opinion Desk",
    "reading_time": 3,
    "image_alt": "A quiet newspaper editorial desk with documents and coffee.",
    "image_prompt": "Ultra-realistic premium American digital newspaper photo illustration. Realistic lighting, realistic lens perspective, realistic human anatomy, grounded documentary composition. No text overlays, no logos, no watermarks, no surreal effects, no duplicated people, no impossible poses. The image must match the article topic exactly. Quiet newspaper editorial desk, documents, laptop, coffee cup, morning light, thoughtful institutional opinion mood, no readable text, no logos.",
    "is_featured": false,
    "video_target": false,
    "source_name": "Editorial desk",
    "source_url": "https://global-news-ai-site.vercel.app"
  },
  {
    "id": "seed-v7-opinion-local-news-001",
    "title": "Opinion: Local News Still Shapes How Communities Understand Risk",
    "dek": "National stories matter, but local reporting often determines whether people know what to do next.",
    "summary": "Local news remains central to how communities understand risk, services and practical decisions.",
    "body": "National stories often dominate attention, but local reporting is what helps people understand what a development means for their own lives.\n\nA weather alert, a school decision, a hospital update or a transit change becomes useful only when people know how it affects their neighborhood. That is where local news still plays an essential role.\n\nThe future of civic trust may depend in part on whether communities can maintain reliable sources of local information.",
    "category": "opinion",
    "subcategory": "Media",
    "author_name": "Editorial Board",
    "author_title": "Opinion Desk",
    "reading_time": 3,
    "image_alt": "A local newsroom desk with community papers and notes.",
    "image_prompt": "Ultra-realistic premium American digital newspaper photo illustration. Realistic lighting, realistic lens perspective, realistic human anatomy, grounded documentary composition. No text overlays, no logos, no watermarks, no surreal effects, no duplicated people, no impossible poses. The image must match the article topic exactly. Local newsroom desk with notebooks, community papers, laptop, soft morning light, no readable text, no logos, reflective editorial mood.",
    "is_featured": false,
    "video_target": false,
    "source_name": "Editorial desk",
    "source_url": "https://global-news-ai-site.vercel.app"
  },
  {
    "id": "seed-v7-opinion-tech-accountability-001",
    "title": "Opinion: AI Tools Need Better Explanations, Not Just Better Demos",
    "dek": "The next stage of AI adoption will depend on trust, reliability and plain-language accountability.",
    "summary": "AI tools need clearer explanations and accountability if they are going to become trusted parts of everyday work.",
    "body": "AI tools do not need only better demos. They need better explanations.\n\nFor many users, the central question is no longer whether a system can produce an impressive answer. It is whether people understand what the system can do, where it fails and who is responsible when it causes problems.\n\nThe companies that win long-term trust may be the ones that make limitations visible instead of hiding them behind polished interfaces.",
    "category": "opinion",
    "subcategory": "Technology",
    "author_name": "Editorial Board",
    "author_title": "Opinion Desk",
    "reading_time": 3,
    "image_alt": "A person reviews AI software documentation at a desk.",
    "image_prompt": "Ultra-realistic premium American digital newspaper photo illustration. Realistic lighting, realistic lens perspective, realistic human anatomy, grounded documentary composition. No text overlays, no logos, no watermarks, no surreal effects, no duplicated people, no impossible poses. The image must match the article topic exactly. Person reviewing AI software documentation at desk, abstract interface on laptop with no readable text, quiet thoughtful mood, realistic office lighting, no logos.",
    "is_featured": false,
    "video_target": false,
    "source_name": "Editorial desk",
    "source_url": "https://global-news-ai-site.vercel.app"
  }
];

function buildSeedPosts(limit: number): SeedPost[] {
  const now = new Date().toISOString();

  return seedStories.slice(0, limit).map((post) => ({
    ...post,
    slug: uniqueSlug(post.title, post.id),
    region: "USA",
    image_url: null,
    video_url: null,
    video_embed_url: null,
    video_source_name: null,
    video_title: null,
    published_at: now,
  }));
}

export async function GET(req: NextRequest) {
  try {
      if (!isAuthorized(req)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") || seedStories.length), seedStories.length);
      const withImages = req.nextUrl.searchParams.get("images") === "1";
      const withVideos = req.nextUrl.searchParams.get("videos") === "1";
      const imageLimit = Math.min(Number(req.nextUrl.searchParams.get("imageLimit") || 2), limit);
      const replace = req.nextUrl.searchParams.get("replace") === "1";

      if (replace) {
        await deleteExpandedSeedPosts();
      }

      const selected = buildSeedPosts(limit);
      const results = [];

      for (let i = 0; i < selected.length; i++) {
        const post = selected[i];

        if (withVideos && post.video_target) {
          const video = await findOfficialYoutubeVideo({
            title: post.title,
            sourceName: post.source_name,
            category: post.category,
          });

          if (video) {
            post.video_url = video.video_url;
            post.video_embed_url = video.video_embed_url;
            post.video_source_name = video.video_source_name;
            post.video_title = video.video_title;
          }
        }

        if (withImages && i < imageLimit) {
          const image = await generateAndUploadImage({
            postId: post.id,
            prompt: post.image_prompt,
          });

          post.image_url = image.imageUrl || null;

          results.push({
            id: post.id,
            title: post.title,
            image_url: image.imageUrl,
            image_error: image.error,
          });
        }

        const { video_target, ...dbPost } = post;

        await supabaseFetch("posts?on_conflict=id", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Prefer: "resolution=merge-duplicates,return=minimal",
          },
          body: JSON.stringify(dbPost),
        });
      }

      const counts = selected.reduce((acc: Record<string, number>, post) => {
        acc[post.category] = (acc[post.category] || 0) + 1;
        return acc;
      }, {});

      return NextResponse.json({
        ok: true,
        inserted: selected.length,
        categories: counts,
        videos_requested: withVideos,
        images_requested: withImages,
        images_attempted: withImages ? imageLimit : 0,
        replace,
        results,
      });
  } catch (error: any) {
    console.error("seed-expanded-newsroom failed", error);

    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Unknown seed-expanded-newsroom error",
        hint: "Check Supabase columns, duplicate slugs, CRON_SECRET, and YOUTUBE_API_KEY. This V7.1 route removes internal fields before insert and uses unique slugs.",
      },
      { status: 500 }
    );
  }
}
