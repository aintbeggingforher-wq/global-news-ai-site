import { NextRequest, NextResponse } from "next/server";
import { generateAndUploadImage } from "@/lib/image";

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
    .slice(0, 82);
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

async function deleteSeedPosts() {
  await supabaseFetch("posts?id=like.seed-*", {
    method: "DELETE",
    headers: { Prefer: "return=minimal" },
  });
}

const seedStories = [
  {
    "id": "seed-texas-warehouse-fire-001",
    "title": "Texas Warehouse Fire Investigated as Suspected Arson",
    "dek": "Authorities are examining whether a major warehouse fire in Texas may have been intentionally set.",
    "summary": "A large warehouse fire in Texas is under investigation as suspected arson after early indicators raised concerns that the blaze may have been intentionally set.",
    "body": "A major fire tore through a warehouse facility in Texas, sending thick smoke above the industrial site and drawing a large emergency response from firefighters, police and investigators.\n\nAuthorities said the fire caused significant structural damage and forced crews to secure the surrounding area while they worked to contain the blaze. Investigators are examining whether the fire may have been intentionally set. Officials have not announced a final determination, but early indicators at the scene prompted an arson-focused review.\n\nFire crews remained on site to monitor hot spots and prevent the fire from spreading to nearby properties. Authorities said the review will include burn patterns, possible entry points, surveillance footage if available and witness statements.",
    "category": "national",
    "subcategory": "Public Safety",
    "author_name": "Daniel Reyes",
    "author_title": "National Affairs Reporter",
    "reading_time": 3,
    "source_name": "Editorial desk",
    "source_url": "https://global-news-ai-site.vercel.app",
    "image_alt": "Firefighters respond from a safe distance to a warehouse fire at an industrial site.",
    "image_prompt": "Ultra-realistic premium American digital newspaper photo illustration. Realistic lighting, realistic lens perspective, realistic human anatomy, grounded documentary composition. No text overlays, no logos, no watermarks, no surreal effects, no duplicated people, no impossible poses. The image must match the article topic exactly. Nighttime Texas industrial warehouse fire. Flames and smoke come from the warehouse roofline, windows and loading bay only. Firefighters stand at a safe operational distance behind police tape, emergency vehicles with realistic red and blue lights, wet pavement, dark smoke, industrial surroundings. No person inside flames, no person touching fire, no fire coming from the ground, no lava, no giant explosion, no injuries, no sensational disaster movie scene.",
    "is_featured": true
  },
  {
    "id": "seed-politics-border-talks-001",
    "title": "White House Signals New Push on Border Security Talks",
    "dek": "Officials say negotiations remain active as border security stays at the center of Washington’s agenda.",
    "summary": "The White House said officials are continuing discussions with congressional leaders as border security negotiations remain a central issue in Washington.",
    "body": "White House officials said border security remains a major focus as negotiations continue with lawmakers on a broader legislative package. Administration officials did not announce a final agreement, but described the talks as active and high priority.\n\nThe issue remains politically sensitive, with both parties seeking to shape the debate around immigration enforcement, asylum processing and federal resources at the border.",
    "category": "politics",
    "subcategory": "White House",
    "author_name": "Olivia Bennett",
    "author_title": "Politics Correspondent",
    "reading_time": 2,
    "source_name": "Editorial desk",
    "source_url": "https://global-news-ai-site.vercel.app",
    "image_alt": "Reporters outside the White House during a political news cycle.",
    "image_prompt": "Ultra-realistic premium American digital newspaper photo illustration. Realistic lighting, realistic lens perspective, realistic human anatomy, grounded documentary composition. No text overlays, no logos, no watermarks, no surreal effects, no duplicated people, no impossible poses. The image must match the article topic exactly. White House exterior in Washington, D.C. with reporters and cameras in the foreground, neutral daylight, restrained political newsroom atmosphere, no dramatic protest scene, no fake signs, no readable text.",
    "is_featured": false
  },
  {
    "id": "seed-business-retail-spending-001",
    "title": "U.S. Retailers Watch Consumer Spending for Signs of Summer Slowdown",
    "dek": "Retailers and analysts are watching whether shoppers become more selective heading into the summer season.",
    "summary": "Major retailers are closely monitoring consumer demand as analysts look for early signs of a summer spending slowdown.",
    "body": "U.S. retailers and market analysts are watching consumer behavior for signs that household budgets may be tightening heading into the summer season. Recent commentary from the retail sector suggests shoppers remain active, though increasingly selective with discretionary purchases.\n\nEconomists say consumer confidence, borrowing costs and pricing pressure remain key variables.",
    "category": "business",
    "subcategory": "Economy",
    "author_name": "Marcus Hill",
    "author_title": "Business Reporter",
    "reading_time": 2,
    "source_name": "Editorial desk",
    "source_url": "https://global-news-ai-site.vercel.app",
    "image_alt": "Shoppers walk through a U.S. retail district.",
    "image_prompt": "Ultra-realistic premium American digital newspaper photo illustration. Realistic lighting, realistic lens perspective, realistic human anatomy, grounded documentary composition. No text overlays, no logos, no watermarks, no surreal effects, no duplicated people, no impossible poses. The image must match the article topic exactly. American retail shopping district in soft daylight, shoppers walking with bags, storefronts without readable brands, realistic city atmosphere, subtle business news tone.",
    "is_featured": false
  },
  {
    "id": "seed-tech-ai-rollouts-001",
    "title": "AI Product Race Intensifies as Tech Firms Expand Consumer Rollouts",
    "dek": "Technology companies are moving faster to push AI tools into consumer and enterprise products.",
    "summary": "Technology companies continue to accelerate AI product launches as competition intensifies across consumer and enterprise markets.",
    "body": "The AI competition among major technology companies remains intense, with firms pushing new tools and integrations across search, productivity software and mobile devices. Analysts say the pace of deployment reflects both commercial pressure and rising expectations from users.\n\nIndustry observers say the focus is shifting from experimentation to usability, ecosystem control and monetization.",
    "category": "technology",
    "subcategory": "Artificial Intelligence",
    "author_name": "Emily Parker",
    "author_title": "Technology Reporter",
    "reading_time": 2,
    "source_name": "Editorial desk",
    "source_url": "https://global-news-ai-site.vercel.app",
    "image_alt": "A modern technology workspace with abstract AI interface visuals.",
    "image_prompt": "Ultra-realistic premium American digital newspaper photo illustration. Realistic lighting, realistic lens perspective, realistic human anatomy, grounded documentary composition. No text overlays, no logos, no watermarks, no surreal effects, no duplicated people, no impossible poses. The image must match the article topic exactly. Modern technology workspace, monitors with abstract non-readable AI interface shapes, editors and engineers in background, realistic office lighting, no copyrighted interface, no text.",
    "is_featured": false
  },
  {
    "id": "seed-world-public-health-alerts-001",
    "title": "Global Health Alerts Put U.S. Preparedness Back in Focus",
    "dek": "Officials are monitoring international alerts while reviewing implications for travel guidance and readiness.",
    "summary": "Public health officials are tracking disease alerts abroad and evaluating any implications for U.S. preparedness and traveler guidance.",
    "body": "Health authorities are monitoring international public health alerts and reviewing updated guidance related to travel, screening and preparedness. Officials emphasized surveillance and timely communication while avoiding alarm.\n\nExperts say public confidence depends on clear messaging, transparency and a balanced understanding of risk. Agencies are expected to continue monitoring developments and adjusting recommendations as needed.",
    "category": "world",
    "subcategory": "Health",
    "author_name": "Nathan Brooks",
    "author_title": "World News Correspondent",
    "reading_time": 2,
    "source_name": "Editorial desk",
    "source_url": "https://global-news-ai-site.vercel.app",
    "image_alt": "Public health officials working in an operations center.",
    "image_prompt": "Ultra-realistic premium American digital newspaper photo illustration. Realistic lighting, realistic lens perspective, realistic human anatomy, grounded documentary composition. No text overlays, no logos, no watermarks, no surreal effects, no duplicated people, no impossible poses. The image must match the article topic exactly. Public health operations center, medical staff reviewing screens and documents, calm institutional setting, realistic lighting, no panic, no graphic imagery, no disease particles, no hospital disaster.",
    "is_featured": false
  },
  {
    "id": "seed-health-hospital-staffing-001",
    "title": "Hospitals Reassess Staffing Plans Ahead of Busy Summer Period",
    "dek": "Health systems are reviewing staffing and emergency planning as summer travel and heat risks increase.",
    "summary": "Hospitals are reviewing staffing plans and emergency readiness ahead of the summer period, when travel, heat and seasonal demand can increase pressure on care teams.",
    "body": "Hospitals and health systems are reassessing staffing plans as administrators prepare for the busy summer period. Emergency departments often face shifting pressure from travel, heat-related illness and local surges in demand.\n\nHealth experts say the focus is on staffing flexibility, patient flow and clear communication with communities.",
    "category": "health",
    "subcategory": "Hospitals",
    "author_name": "Sofia Turner",
    "author_title": "Health Reporter",
    "reading_time": 2,
    "source_name": "Editorial desk",
    "source_url": "https://global-news-ai-site.vercel.app",
    "image_alt": "Hospital staff prepare a quiet emergency department area.",
    "image_prompt": "Ultra-realistic premium American digital newspaper photo illustration. Realistic lighting, realistic lens perspective, realistic human anatomy, grounded documentary composition. No text overlays, no logos, no watermarks, no surreal effects, no duplicated people, no impossible poses. The image must match the article topic exactly. Quiet American hospital emergency department preparation scene, nurses and clinicians at a desk, clean institutional lighting, realistic staffing environment, no patients in distress, no graphic details, no logos.",
    "is_featured": false
  },
  {
    "id": "seed-sports-championship-weekend-001",
    "title": "Championship Weekend Draws Heavy Attention from U.S. Sports Fans",
    "dek": "Several major sporting events are driving strong digital interest and live coverage.",
    "summary": "Fans across the country are closely following a busy championship weekend as several major sporting events draw national attention.",
    "body": "A packed sports weekend is drawing broad attention from U.S. fans, with multiple high-profile events generating heavy coverage and online discussion. Broadcasters and leagues are seeing strong engagement as audiences follow key matchups, results and storylines.\n\nAnalysts say the convergence of marquee events has helped sustain momentum across the sports news cycle.",
    "category": "sports",
    "subcategory": "Sports News",
    "author_name": "Jason Cole",
    "author_title": "Sports Correspondent",
    "reading_time": 2,
    "source_name": "Editorial desk",
    "source_url": "https://global-news-ai-site.vercel.app",
    "image_alt": "Fans fill a U.S. stadium during a major sports event.",
    "image_prompt": "Ultra-realistic premium American digital newspaper photo illustration. Realistic lighting, realistic lens perspective, realistic human anatomy, grounded documentary composition. No text overlays, no logos, no watermarks, no surreal effects, no duplicated people, no impossible poses. The image must match the article topic exactly. U.S. stadium atmosphere at night, fans in stands, field lighting, sideline press area, realistic sports energy, no logos, no readable scoreboard, no distorted faces.",
    "is_featured": false
  },
  {
    "id": "seed-style-entertainment-strategy-001",
    "title": "Streaming and Box Office Trends Reshape Entertainment Strategy",
    "dek": "Studios and platforms are adjusting as audiences split attention across theaters and streaming.",
    "summary": "Media companies are adjusting entertainment strategies as streaming competition and box office performance continue to evolve.",
    "body": "Entertainment executives are rethinking release strategies as streaming economics and theatrical performance remain under close scrutiny. Industry analysts say content investment, franchise reliance and subscriber retention are central concerns across the sector.\n\nAudience behavior has become harder to predict, pushing studios and platforms to balance scale with efficiency.",
    "category": "style",
    "subcategory": "Entertainment",
    "author_name": "Rachel Kim",
    "author_title": "Culture Reporter",
    "reading_time": 2,
    "source_name": "Editorial desk",
    "source_url": "https://global-news-ai-site.vercel.app",
    "image_alt": "A cinema district at night.",
    "image_prompt": "Ultra-realistic premium American digital newspaper photo illustration. Realistic lighting, realistic lens perspective, realistic human anatomy, grounded documentary composition. No text overlays, no logos, no watermarks, no surreal effects, no duplicated people, no impossible poses. The image must match the article topic exactly. American cinema district at night, glowing theater entrance, people walking outside, modern entertainment atmosphere, no readable movie titles, no logos.",
    "is_featured": false
  },
  {
    "id": "seed-climate-severe-weather-001",
    "title": "Severe Weather Threat Keeps Emergency Teams on Alert Across Several States",
    "dek": "Emergency officials are monitoring storms and preparing for possible local disruptions.",
    "summary": "Emergency officials across several states are monitoring severe weather conditions and preparing for possible local disruptions.",
    "body": "Weather officials and emergency teams remain on alert in several states as shifting conditions raise concerns about storms, heavy rain and localized disruption. Authorities urged residents to monitor local forecasts and follow official guidance where needed.\n\nForecasters said conditions can evolve quickly, especially in areas already vulnerable to flooding or wind damage.",
    "category": "climate",
    "subcategory": "Weather",
    "author_name": "Noah Grant",
    "author_title": "Climate Reporter",
    "reading_time": 2,
    "source_name": "Editorial desk",
    "source_url": "https://global-news-ai-site.vercel.app",
    "image_alt": "Storm clouds form over an American town.",
    "image_prompt": "Ultra-realistic premium American digital newspaper photo illustration. Realistic lighting, realistic lens perspective, realistic human anatomy, grounded documentary composition. No text overlays, no logos, no watermarks, no surreal effects, no duplicated people, no impossible poses. The image must match the article topic exactly. Storm clouds over a small American town, emergency vehicles parked at a distance, realistic atmospheric lighting, no tornado unless far away, no disaster exaggeration.",
    "is_featured": false
  },
  {
    "id": "seed-opinion-institutions-trust-001",
    "title": "Opinion: Trust in Institutions Depends on Clearer Public Communication",
    "dek": "Public confidence is shaped not only by policy, but by whether institutions explain decisions clearly.",
    "summary": "Public confidence in institutions depends on transparency, consistency and whether officials communicate uncertainty honestly.",
    "body": "Institutions often lose public trust not only because of what they decide, but because of how those decisions are explained. Clear communication matters most during moments of uncertainty, when audiences are looking for consistency and honesty.\n\nThe strongest public messaging does not pretend every answer is settled. It explains what is known, what remains under review and when people can expect reliable updates.",
    "category": "opinion",
    "subcategory": "Analysis",
    "author_name": "Editorial Board",
    "author_title": "Opinion Desk",
    "reading_time": 2,
    "source_name": "Editorial desk",
    "source_url": "https://global-news-ai-site.vercel.app",
    "image_alt": "A quiet newspaper editorial desk with documents and coffee.",
    "image_prompt": "Ultra-realistic premium American digital newspaper photo illustration. Realistic lighting, realistic lens perspective, realistic human anatomy, grounded documentary composition. No text overlays, no logos, no watermarks, no surreal effects, no duplicated people, no impossible poses. The image must match the article topic exactly. Quiet newspaper editorial desk, documents, laptop, coffee cup, morning light, thoughtful institutional opinion mood, no readable text, no logos.",
    "is_featured": false
  }
];

function buildSeedPosts(limit: number): SeedPost[] {
  const now = new Date().toISOString();

  return seedStories.slice(0, limit).map((post) => ({
    ...post,
    slug: slugify(post.title),
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
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") || seedStories.length), seedStories.length);
  const withImages = req.nextUrl.searchParams.get("images") === "1";
  const imageLimit = Math.min(Number(req.nextUrl.searchParams.get("imageLimit") || 2), limit);
  const replace = req.nextUrl.searchParams.get("replace") === "1";

  if (replace) {
    await deleteSeedPosts();
  }

  const selected = buildSeedPosts(limit);
  const results = [];

  for (let i = 0; i < selected.length; i++) {
    const post = selected[i];

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

    await supabaseFetch("posts?on_conflict=id", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(post),
    });
  }

  return NextResponse.json({
    ok: true,
    inserted: selected.length,
    images_requested: withImages,
    images_attempted: withImages ? imageLimit : 0,
    replace,
    results,
  });
}
