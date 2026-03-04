import jsPDF from 'jspdf';

export function generateTutorialPDF() {
  const doc = new jsPDF({ unit: 'mm', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  const checkPage = (needed: number) => {
    if (y + needed > 260) {
      doc.addPage();
      y = 20;
    }
  };

  const addTitle = (text: string, size: number) => {
    checkPage(20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(size);
    doc.setTextColor(90, 60, 30);
    doc.text(text, pageWidth / 2, y, { align: 'center' });
    y += size * 0.6;
  };

  const addBody = (text: string) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    const lines = doc.splitTextToSize(text, contentWidth);
    checkPage(lines.length * 5);
    doc.text(lines, margin, y);
    y += lines.length * 5 + 3;
  };

  const addTip = (text: string) => {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(120, 80, 40);
    const lines = doc.splitTextToSize('✦ TIP: ' + text, contentWidth - 10);
    checkPage(lines.length * 4.5 + 4);
    doc.setFillColor(250, 245, 235);
    doc.roundedRect(margin, y - 3, contentWidth, lines.length * 4.5 + 6, 2, 2, 'F');
    doc.text(lines, margin + 5, y + 1);
    y += lines.length * 4.5 + 8;
  };

  const addStepHeader = (num: number, title: string) => {
    checkPage(15);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(139, 90, 43);
    doc.text(`${num}`, margin, y);
    doc.setTextColor(50, 50, 50);
    doc.text(title, margin + 8, y);
    y += 7;
  };

  // === PAGE 1: Cover ===
  y = 40;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(32);
  doc.setTextColor(90, 60, 30);
  doc.text('Coffee:', pageWidth / 2, y, { align: 'center' });
  y += 14;
  doc.text('Habesha', pageWidth / 2, y, { align: 'center' });
  y += 14;

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(14);
  doc.setTextColor(120, 90, 50);
  doc.text('A Journey From the Birthplace of Coffee to Your Home', pageWidth / 2, y, { align: 'center' });
  y += 16;

  addBody('Ethiopia is not just where Coffee Habesha was born — it is where coffee itself was born. Legend holds that a goat herder named Kaldi first discovered the coffee plant on the ancient highlands of Kaffa, in what is now southwestern Ethiopia. For over a thousand years, the Ethiopian people have honored this gift through a ceremony unlike anything else in the world: the Jebena Buna — the traditional Ethiopian coffee ritual.');
  y += 3;
  addBody('Prepared in a hand-crafted clay pot called a Jebena, and served with popcorn, incense, and community, this is not just coffee — it is connection, patience, and heritage poured into a small porcelain cup. At Coffee Habesha, every bag of beans we roast carries this story. Now we invite you to bring the ritual home.');

  y += 8;
  doc.setDrawColor(180, 140, 80);
  doc.setLineWidth(0.5);
  doc.line(margin + 20, y, pageWidth - margin - 20, y);
  y += 8;

  addTitle('THE AUTHENTIC ETHIOPIAN JEBENA COFFEE RITUAL', 14);
  y += 8;

  addTitle('WHAT IS A JEBENA?', 13);
  y += 2;
  addBody('A Jebena (also spelled Jabena or Gebena) is a traditional Ethiopian clay coffee pot with a round base, long neck, and woven straw or fabric stopper. It has been used for centuries to brew coffee over an open flame, allowing the grounds to settle naturally and the brew to develop its full, rich body. The result is a cup unlike any espresso or drip coffee you have ever tasted — bold, smooth, slightly earthy, and deeply aromatic.');
  addBody('Coffee Habesha sells authentic, hand-crafted Jebena pots in-store — each one a piece of living heritage you can use at home every morning.');

  y += 5;
  addTitle("WHAT YOU'LL NEED", 13);
  y += 2;
  const ingredients = [
    'Coffee Habesha beans — medium or dark roast (we recommend Dark for Jebena)',
    'Fresh cold water — filtered if possible',
    'Sugar — white or raw cane sugar to taste',
    'Optional: a pinch of cardamom or cloves for warmth',
    'Optional: a small bowl of popcorn to serve alongside (traditional!)',
  ];
  const equipment = [
    'Authentic clay Jebena pot (available in-store at Coffee Habesha)',
    'Burr hand grinder — fine to medium-fine grind',
    'Small gas burner, electric coil, or campfire',
    'Fine mesh strainer or cloth filter',
    'Small traditional cups (finjal) — or any small espresso-sized cup',
    'Incense stick — frankincense is traditional (optional but magical)',
  ];

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(90, 60, 30);
  checkPage(10);
  doc.text("You'll Need:", margin, y);
  doc.text('Equipment:', pageWidth / 2 + 5, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);

  const maxItems = Math.max(ingredients.length, equipment.length);
  for (let i = 0; i < maxItems; i++) {
    checkPage(5);
    if (i < ingredients.length) {
      doc.text('◆ ' + ingredients[i], margin + 2, y, { maxWidth: contentWidth / 2 - 10 });
    }
    if (i < equipment.length) {
      doc.text('◆ ' + equipment[i], pageWidth / 2 + 7, y, { maxWidth: contentWidth / 2 - 10 });
    }
    y += 6;
  }

  y += 5;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(10);
  doc.setTextColor(120, 90, 50);
  checkPage(8);
  doc.text('"Buna dabo naw" — "Coffee is our bread." — Ethiopian proverb', pageWidth / 2, y, { align: 'center' });

  // === PAGE 2: Steps ===
  doc.addPage();
  y = 20;
  addTitle('THE PREPARATION — STEP BY STEP', 16);
  y += 3;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text('☕ Serves 1–3 People    ⏱ Prep: 5 min    🔥 Brew: 20–30 min', pageWidth / 2, y, { align: 'center' });
  y += 10;

  const steps = [
    {
      title: 'Set the Mood',
      body: 'Before you begin, light a stick of frankincense or Ethiopian incense if you have it. In the traditional ceremony, incense is burned to purify the space and signal to the community that coffee is being prepared. Put on some quiet Ethiopian music. Slow down. This ritual takes time — and that is the point.',
      tip: 'The ceremony is as much about presence as it is about the coffee. Give yourself 30 minutes of unhurried time.',
    },
    {
      title: 'Grind Your Beans',
      body: 'Measure 2 heaping tablespoons of Coffee Habesha medium or dark roast beans per person (approximately 15–18g). Grind to a medium-fine consistency — slightly coarser than espresso, finer than drip. The grind should feel like fine sand between your fingers. A burr grinder gives the most consistent result.',
      tip: 'We recommend the Coffee Habesha Dark Roast for Jebena preparation — the clay pot brewing method draws out a smooth, full-bodied cup that pairs perfectly with a bold roast.',
    },
    {
      title: 'Add Cold Water to the Jebena',
      body: 'Fill your Jebena with fresh cold water — approximately 1 cup (240ml) per person you are serving. Cold water is important: it allows the brew to develop slowly as the pot heats, extracting the full complexity of the coffee without bitterness. Place the stopper loosely in the neck.',
      tip: 'Never use hot or pre-boiled water. The slow heat-up through the clay pot is part of what makes Jebena coffee taste different from any other brew method.',
    },
    {
      title: 'Place Over Low Heat',
      body: 'Set the Jebena on your burner over low to medium-low heat. Allow the water to come to a gentle simmer — not a rolling boil. You will begin to hear the water moving inside the pot and see small wisps of steam from the neck. This takes about 8–12 minutes. Do not rush it.',
      tip: 'Clay Jebena pots are fragile when cold. Start on very low heat and gradually increase. Never place a cold Jebena directly onto a high flame.',
    },
    {
      title: 'Add the Ground Coffee',
      body: 'Once the water reaches a steady gentle simmer, carefully remove the stopper and add your ground coffee directly into the pot. Stir gently with a long spoon if possible, or swirl the pot carefully to incorporate the grounds. Replace the stopper loosely.',
      tip: 'Some Ethiopian households add sugar directly to the pot at this stage. Others serve sugar separately so each person can adjust. Both are perfectly traditional.',
    },
    {
      title: 'Let It Brew',
      body: 'Allow the coffee to continue brewing over low heat for 8–12 minutes. The Jebena will begin to bubble gently — this is perfect. You are looking for a slow, controlled bubble, not a violent boil. The grounds will gradually settle to the bottom of the round base as the coffee brews.',
      tip: 'Watch for the brew starting to rise up the neck of the Jebena. This means it is nearly ready. Remove from heat immediately if it begins to overflow.',
    },
    {
      title: 'Rest and Settle',
      body: 'Remove the Jebena from the heat and allow it to rest for 3–5 minutes. This is the most important step. The grounds need time to fully settle to the bottom of the round base before you pour. Rushing this step results in a muddy, gritty cup.',
      tip: 'Place the Jebena on a woven straw mat or a folded kitchen towel while it rests. This keeps the clay warm and looks beautiful on a table.',
    },
    {
      title: 'The Pour — Tilt and Flow',
      body: 'Hold the Jebena by its handle and tilt it slowly, pouring in a smooth, uninterrupted stream into your small cups. The long neck acts as a natural filter — pour steadily from a slight height (4–6 inches above the cup) to aerate the coffee and leave the grounds behind. Fill each cup about two-thirds full.',
      tip: "The first cup — called 'Abol' — is considered the strongest and most precious. Offer it to your most honored guest.",
    },
    {
      title: 'The Three Rounds',
      body: 'Traditionally, Ethiopian coffee is served in three rounds. The first round (Abol) is the strongest. Water is added back to the Jebena with remaining grounds and rebrewed for a second round (Tona) — slightly lighter. A third round (Baraka, meaning "blessing") follows. It is considered impolite to leave before the third cup.',
      tip: 'You can add more water to your Jebena after the first pour and place it back on low heat for a second and third brew. Each round is lighter but still deeply flavorful.',
    },
  ];

  steps.forEach((step, i) => {
    addStepHeader(i + 1, step.title);
    addBody(step.body);
    addTip(step.tip);
    y += 2;
  });

  // === Serving & Three Rounds ===
  checkPage(30);
  y += 5;
  addTitle('THE TRADITIONAL SERVING', 14);
  y += 3;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(90, 60, 30);
  doc.text('Serve With:', margin, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);
  const servings = [
    'A small bowl of plain salted popcorn — the classic pairing',
    'Kolo — roasted barley and sunflower seed mix',
    'A few pieces of injera or Ethiopian flatbread',
    'Dates or dried figs for natural sweetness',
    'White or raw cane sugar on the side',
  ];
  servings.forEach((s) => {
    checkPage(5);
    doc.text('◆ ' + s, margin + 2, y);
    y += 5;
  });

  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(90, 60, 30);
  checkPage(8);
  doc.text('The Three Rounds:', margin, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);
  const rounds = [
    'Abol (1st Round) — The strongest, most flavorful cup — offered to the guest of honor',
    'Tona (2nd Round) — The second brew — lighter, warm, a moment of reflection',
    'Baraka (3rd Round) — "Blessing" — the lightest cup, drunk to close the ceremony with gratitude',
  ];
  rounds.forEach((r) => {
    checkPage(5);
    doc.text('◆ ' + r, margin + 2, y, { maxWidth: contentWidth });
    y += 6;
  });

  // === Footer ===
  y += 10;
  checkPage(20);
  doc.setDrawColor(180, 140, 80);
  doc.setLineWidth(0.5);
  doc.line(margin + 20, y, pageWidth - margin - 20, y);
  y += 8;

  addTitle('BRING THE RITUAL HOME', 14);
  y += 3;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text('Authentic clay Jebena pots, Coffee Habesha beans, hand grinders,', pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.text('and branded measuring spoons are available in-store at Coffee Habesha Café & Roastery', pageWidth / 2, y, { align: 'center' });
  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(139, 90, 43);
  doc.text('coffeehabesha.com • (877) 788-0389 • @coffee.habesha', pageWidth / 2, y, { align: 'center' });

  doc.save('Coffee-Habesha-Jebena-Tutorial.pdf');
}
