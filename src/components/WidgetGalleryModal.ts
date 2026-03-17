import { t } from '@/services/i18n';
import {
  WIDGET_TEMPLATES,
  getAllCategories,
  getTemplatesByCategory,
  type WidgetTemplate,
  type TemplateCategory,
} from '@/services/widget-templates';
import { saveWidget, type CustomWidgetSpec } from '@/services/widget-store';
import { openWidgetChatModal } from '@/components/WidgetChatModal';

let galleryOverlay: HTMLElement | null = null;

export interface WidgetGalleryOptions {
  onAddInstant: (spec: CustomWidgetSpec) => void;
  onComplete: (spec: CustomWidgetSpec) => void;
}

export function openWidgetGalleryModal(options: WidgetGalleryOptions): void {
  closeWidgetGalleryModal();

  galleryOverlay = document.createElement('div');
  galleryOverlay.className = 'modal-overlay active';

  const modal = document.createElement('div');
  modal.className = 'modal wm-gallery-modal';

  const header = document.createElement('div');
  header.className = 'modal-header';
  const titleEl = document.createElement('span');
  titleEl.className = 'modal-title';
  titleEl.textContent = t('widgets.gallery.title');
  const closeBtn = document.createElement('button');
  closeBtn.className = 'modal-close';
  closeBtn.setAttribute('aria-label', t('common.close'));
  closeBtn.textContent = '\u00D7';
  header.appendChild(titleEl);
  header.appendChild(closeBtn);

  const tabsEl = document.createElement('div');
  tabsEl.className = 'wm-gallery-category-tabs';

  const allTab = document.createElement('button');
  allTab.className = 'wm-gallery-tab active';
  allTab.dataset.cat = 'all';
  allTab.textContent = t('widgets.gallery.tabAll');
  tabsEl.appendChild(allTab);

  const categoryLabelMap: Record<TemplateCategory, string> = {
    markets: t('widgets.gallery.tabMarkets'),
    geopolitics: t('widgets.gallery.tabGeopolitics'),
    aviation: t('widgets.gallery.tabAviation'),
    security: t('widgets.gallery.tabSecurity'),
    environment: t('widgets.gallery.tabEnvironment'),
    research: t('widgets.gallery.tabResearch'),
  };

  for (const cat of getAllCategories()) {
    const tab = document.createElement('button');
    tab.className = 'wm-gallery-tab';
    tab.dataset.cat = cat;
    tab.textContent = categoryLabelMap[cat];
    tabsEl.appendChild(tab);
  }

  const gridEl = document.createElement('div');
  gridEl.className = 'wm-gallery-grid';

  modal.appendChild(header);
  modal.appendChild(tabsEl);
  modal.appendChild(gridEl);
  galleryOverlay.appendChild(modal);
  document.body.appendChild(galleryOverlay);

  renderCards(gridEl, 'all', options);

  const tabs = tabsEl.querySelectorAll<HTMLButtonElement>('.wm-gallery-tab');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      renderCards(gridEl, tab.dataset.cat ?? 'all', options);
    });
  });

  closeBtn.addEventListener('click', closeWidgetGalleryModal);
  galleryOverlay.addEventListener('click', (e) => {
    if (e.target === galleryOverlay) closeWidgetGalleryModal();
  });

  const escHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') closeWidgetGalleryModal();
  };
  document.addEventListener('keydown', escHandler);

  (galleryOverlay as HTMLElement & { _escHandler: (e: KeyboardEvent) => void })._escHandler = escHandler;
}

export function closeWidgetGalleryModal(): void {
  if (galleryOverlay) {
    const o = galleryOverlay as HTMLElement & { _escHandler?: (e: KeyboardEvent) => void };
    if (o._escHandler) document.removeEventListener('keydown', o._escHandler);
    galleryOverlay.remove();
    galleryOverlay = null;
  }
}

function renderCards(gridEl: HTMLElement, activeCat: string, options: WidgetGalleryOptions): void {
  gridEl.innerHTML = '';

  const templates: WidgetTemplate[] =
    activeCat === 'all'
      ? WIDGET_TEMPLATES
      : getTemplatesByCategory(activeCat as TemplateCategory);

  for (const template of templates) {
    const card = buildCard(template, options);
    gridEl.appendChild(card);
  }
}

function buildCard(template: WidgetTemplate, options: WidgetGalleryOptions): HTMLElement {
  const card = document.createElement('div');
  card.className = 'wm-gallery-card';

  const cardHeader = document.createElement('div');
  cardHeader.className = 'wm-gallery-card-header';

  const emojiEl = document.createElement('span');
  emojiEl.className = 'wm-gallery-card-emoji';
  emojiEl.textContent = template.emoji;

  const headerInfo = document.createElement('div');
  const titleEl = document.createElement('div');
  titleEl.className = 'wm-gallery-card-title';
  titleEl.textContent = template.title;
  const catEl = document.createElement('span');
  catEl.className = 'wm-gallery-card-cat';
  catEl.textContent = template.category;
  headerInfo.appendChild(titleEl);
  headerInfo.appendChild(catEl);

  cardHeader.appendChild(emojiEl);
  cardHeader.appendChild(headerInfo);

  const descEl = document.createElement('p');
  descEl.className = 'wm-gallery-card-desc';
  descEl.textContent = template.description;

  const footer = document.createElement('div');
  footer.className = 'wm-gallery-card-footer';

  const tierEl = document.createElement('span');
  tierEl.className = 'wm-gallery-card-tier';
  tierEl.textContent = template.tier === 'pro'
    ? t('widgets.gallery.tierPro')
    : t('widgets.gallery.tierFree');

  const actionsEl = document.createElement('div');
  actionsEl.className = 'wm-gallery-card-actions';

  const instantBtn = document.createElement('button');
  instantBtn.className = 'wm-gallery-btn-instant';
  instantBtn.textContent = t('widgets.gallery.addInstantly');

  const customizeBtn = document.createElement('button');
  customizeBtn.className = 'wm-gallery-btn-customize';
  customizeBtn.textContent = t('widgets.gallery.customize');

  actionsEl.appendChild(instantBtn);
  actionsEl.appendChild(customizeBtn);
  footer.appendChild(tierEl);
  footer.appendChild(actionsEl);

  card.appendChild(cardHeader);
  card.appendChild(descEl);
  card.appendChild(footer);

  instantBtn.addEventListener('click', () => {
    const spec: CustomWidgetSpec = {
      id: `cw-${crypto.randomUUID()}`,
      title: template.title,
      html: template.html,
      prompt: template.prompt,
      tier: template.tier,
      accentColor: null,
      conversationHistory: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    saveWidget(spec);
    options.onAddInstant(spec);
    closeWidgetGalleryModal();
  });

  customizeBtn.addEventListener('click', () => {
    const prompt = template.prompt;
    const tier = template.tier;
    closeWidgetGalleryModal();
    requestAnimationFrame(() => {
      openWidgetChatModal({
        mode: 'create',
        tier,
        onComplete: (spec) => options.onComplete(spec),
      });
      requestAnimationFrame(() => {
        const input = document.querySelector('.widget-chat-input') as HTMLTextAreaElement | null;
        if (input) {
          input.value = prompt;
          input.dispatchEvent(new Event('input'));
        }
      });
    });
  });

  return card;
}
