import { createWidget } from 'discourse/widgets/widget';
import { iconVDom } from 'discourse/helpers/fa-icon';
import { longDate } from 'discourse/lib/formatter';

const FIFTY_HOURS = 60 * 50 * 1000;

export default createWidget('post-edits-indicator', {
  tagName: 'div.post-info.edits',

  historyHeat(updatedAt) {
    if (!updatedAt) { return; }

    // Show heat on age
    const rightNow = new Date().getTime();
    const updatedAtTime = updatedAt.getTime();

    const siteSettings = this.siteSettings;
    if (updatedAtTime > (rightNow - FIFTY_HOURS * siteSettings.history_hours_low)) return 'heatmap-high';
    if (updatedAtTime > (rightNow - FIFTY_HOURS * siteSettings.history_hours_medium)) return 'heatmap-med';
    if (updatedAtTime > (rightNow - FIFTY_HOURS * siteSettings.history_hours_high)) return 'heatmap-low';
  },

  html(attrs) {
    const contents = [attrs.version - 1, ' ', iconVDom('pencil')];
    const updatedAt = new Date(attrs.updated_at);

    const title = `${I18n.t('post.last_edited_on')} ${longDate(updatedAt)}`;
    return this.fragment('a', {
      className: this.historyHeat(updatedAt),
      attributes: { title }
    }, contents);
  },

  click() {
    if (this.attrs.can_view_edit_history) {
      this.sendWidgetAction('showHistory');
    }
  }
});

