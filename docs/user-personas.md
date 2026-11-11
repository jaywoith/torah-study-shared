# User Personas and Specs

## Model User (Jay)

- **Theological framework**: Masorti / Conservative (traditional-leaning). The AI Rabbi and all generated material stay inside a Conservative framework that treats Halachah as binding, values the traditional Siddur and sources, and is open to Musar and Kabbalah without adopting a purely historical-critical or progressive lens as the default.
- **Learning level**: Intermediate. Past pure beginner (works with shoresh, POS, nikkud, and detailed kavannah notes) but not yet in continuous advanced Talmud or primary Kabbalistic text study.
- **Primary interests**: Siddur / davening / kavannah (especially Shacharit and Pesukei Dezimra), Musar, Kabbalah, Prayerbook Hebrew, and structured daily Torah study.
- **Study length preference**: Medium (Daily Dose style) with the ability to expand individual units.
- **Language mode**: English with transliteration + important words in pointed Hebrew.
- **Practice context**: Attends minyan for Shacharit, enjoys davening, and wants the app to deepen existing practice rather than replace it.

## Specs for a Conservative Intermediate User

### Daily Study generation rules
- Default length: medium.
- Sources drawn from: Tanakh with traditional Conservative commentaries, selected Midrash, Musar excerpts, and light Kabbalistic framing when the user has opted into it.
- AI Rabbi tone: respectful of traditional sources, emphasizes kavannah and practical application, cites sources, and does not default to progressive reinterpretations.
- Personalization: weights Siddur-related material and Musar higher when those interests are selected; tracks progress on Hebrew recognition and shoresh familiarity.

### Siddur Path rules
- Sequence begins with Shacharit / Pesukei Dezimra and moves blessing-by-blessing or line-by-line.
- Each unit includes: pointed Hebrew, transliteration, English, short traditional commentary appropriate to Conservative framework, and a kavannah prompt.
- Integrates with the mixed language mode.
- AI can surface connections to Musar or Kabbalah when relevant without forcing them.

### Specialized paths
- **Musar Path**: daily short selections from classic works with practical reflection questions.
- **Kabbalah Path**: introductory and intermediate material presented within Conservative bounds (symbolic and ethical emphasis first; deeper theosophic material only at advanced level and with clear framing).
- **Halachah Path**: practical rulings consistent with Conservative positions, with notes on traditional alternatives when useful.

### Rabbi Coach
- Weekly check-in reviews completed Siddur units, Musar reflections, and any Hebrew progress.
- Quizzes focus on recognition, shoresh, and kavannah rather than pure grammar.
- Discussion stays inside the Conservative framework while remaining open to traditional sources.

## Specs for remaining frameworks and levels

The packages use the same models for every combination. Differences are expressed as configuration, not hard-coded branches.

### Frameworks
- **Hasidic**: Emphasizes Chassidic sources, deeper Kabbalah earlier, and emotional/devotional framing.
- **Orthodox**: Strict traditional sources and Halachah. Limited use of academic or historical-critical material.
- **Modern Orthodox**: Traditional Halachah with engagement of broader sources and contemporary application.
- **Masorti / Conservative**: As detailed above.
- **Reform**: Ethical and historical emphasis; traditional sources presented as valuable but not binding in the same way.

### Learning levels
- **Beginner**: Heavy scaffolding, more English, basic vocabulary, short units, frequent review.
- **Intermediate**: Shores, POS, pointed Hebrew for key terms, moderate commentary.
- **Advanced**: Longer primary texts, multiple commentaries, less scaffolding.
- **Scholar**: Assumes facility with sources; AI acts more as discussion partner than teacher.

Each combination (framework × level × interests × length) is a valid generation target.
