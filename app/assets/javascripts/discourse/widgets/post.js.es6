import RawHtml from 'discourse/widgets/raw-html';
import { createWidget } from 'discourse/widgets/widget';
import { iconVDom } from 'discourse/helpers/fa-icon';
import { relativeAge, longDate } from 'discourse/lib/formatter';

export function avatarFor(wanted, attrs) {
  const size = Discourse.Utilities.translateSize(wanted);
  const url = Discourse.Utilities.avatarUrl(attrs.template, size);

  // We won't render an invalid url
  if (!url || url.length === 0) { return; }
  const title = attrs.username;

  const properties = {
    attributes: { alt: '', width: size, height: size, src: Discourse.getURLWithCDN(url), title },
    className: 'avatar'
  };

  const img = this.fragment('img', properties);

  return this.fragment('a', {
    className: `trigger-user-card ${attrs.className || ''}`,
    attributes: { href: attrs.url, 'data-user-card': attrs.username }
  }, img);
}

createWidget('reply-to-tab', {
  tagName: 'a.reply-to-tab',

  defaultState() {
    return { loading: false };
  },

  html(attrs, state) {
    if (state.loading) { return I18n.t('loading'); }

    return [iconVDom('mail-forward'),
            ' ',
            avatarFor.call(this, 'small', {
              template: attrs.replyToAvatarTemplate,
              username: attrs.replyToUsername
            }),
            ' ',
            this.fragment('span', attrs.replyToUsername)];
  },

  click() {
    this.state.loading = true;
    this.sendWidgetAction('toggleReplyHistory').then(() => this.state.loading = false);
  }
});

createWidget('post-avatar', {
  tagName: 'div.topic-avatar',

  html(attrs) {
    let body;
    if (!attrs.user_id) {
      body = this.fragment('i', { className: 'fa fa-trash-o deleted-user-avatar' });
    } else {
      body = avatarFor.call(this, 'large', {
        template: attrs.avatar_template,
        username: attrs.username,
        url: attrs.usernameUrl,
        className: 'main-avatar'
      });
    }

    // TODO: plugin-outlet `poster-avatar-bottom`
    return [body, this.fragment('div.poster-avatar-extra')];
  }
});


createWidget('wiki-edit-button', {
  tagName: 'div.post-info.wiki',
  title: 'post.wiki.about',

  html() {
    return iconVDom('pencil-square-o');
  },

  click() {
    this.sendWidgetAction('editPost');
  }
});

createWidget('post-email-indicator', {
  tagName: 'div.post-info.via-email',
  title: 'post.via_email',

  buildClasses(attrs) {
    return attrs.canViewRawEmail ? 'raw-email' : null;
  },

  html() {
    return iconVDom('envelope-o');
  },

  click() {
    if (this.attrs.canViewRawEmail) {
      this.sendWidgetAction('showRawEmail');
    }
  }
});

createWidget('post-meta-data', {
  tagName: 'div.topic-meta-data',
  html(attrs) {
    const result = [this.attach('poster-name', attrs)];

    if (attrs.isWhisper) {
      result.push(this.fragment('div.post-info.whisper', {
        attributes: { title: I18n.t('post.whisper') },
      }, iconVDom('eye-slash')));
    }

    const createdAt = new Date(attrs.created_at);
    if (createdAt) {
      const dateContents = this.fragment('span', {
        attributes: { title: longDate(createdAt) }
      }, relativeAge(createdAt));

      result.push(this.fragment('div.post-info',
        this.fragment('a.post-date', {
          attributes: {
            href: attrs.shareUrl,
            'data-share-url': attrs.shareUrl,
            'data-post-number': attrs.post_number
          }
        }, dateContents)
      ));
    }

    if (attrs.via_email) {
      result.push(this.attach('post-email-indicator', attrs));
    }

    if (attrs.version > 1) {
      result.push(this.attach('post-edits-indicator', attrs));
    }

    if (attrs.wiki) {
      result.push(this.attach('wiki-edit-button', attrs));
    }

    if (attrs.replyToUsername &&
        (!this.siteSettings.suppress_reply_directly_above ||
        (attrs.reply_to_post_number < attrs.post_number - 1))) {
      result.push(this.attach('reply-to-tab', attrs));
    }

    result.push(this.fragment('div.read-state', {
      className: attrs.read ? 'read' : null,
      attributes: {
        title: I18n.t('post.unread')
      }
    }, iconVDom('circle')));

    return result;
  }
});

createWidget('post-body', {
  tagName: 'div.topic-body',
  html(attrs) {
    const cooked = new RawHtml({html: `<div class='cooked'>${attrs.cooked}</div>`});
    return [
      this.attach('post-meta-data', attrs),
      this.fragment('div.regular', [
        cooked,
        this.attach('post-menu', attrs),
        this.attach('actions-summary', attrs)
      ])
    ];
  }
});

createWidget('post-article', {
  tagName: 'article.boxed',

  buildId(attrs) {
    return `post_${attrs.post_number}`;
  },

  buildClasses(attrs) {
    if (attrs.via_email) { return 'via-email'; }
  },

  buildAttributes(attrs) {
    return { 'data-post-id': attrs.id, 'data-user-id': attrs.user_id };
  },

  html(attrs) {
    return this.fragment('div.row', [this.attach('post-avatar', attrs), this.attach('post-body', attrs)]);
  }
});

export default createWidget('post', {

  buildClasses(attrs) {
    const classNames = ['topic-post', 'clearfix'];
    if (attrs.topicOwner) { classNames.push('topic-owner'); }
    if (attrs.hidden) { classNames.push('post-hidden'); }
    if (attrs.deleted) { classNames.push('deleted'); }
    if (attrs.primary_group_name) { classNames.push(`group-${attrs.primary_group_name}`); }
    if (attrs.wiki) { classNames.push(`wiki`); }
    if (attrs.isWhisper) { classNames.push('whisper'); }
    if (attrs.isModeratorAction || (attrs.isWarning && attrs.firstPost)) {
      classNames.push('moderator');
    } else {
      classNames.push('regular');
    }
    return classNames;
  },

  html(attrs) {
    return this.attach('post-article', attrs);
  },

  toggleLike() {
    const post = this.model;
    const likeAction = post.get('likeAction');

    if (likeAction && likeAction.get('canToggle')) {
      return likeAction.togglePromise(post);
    }
  },

  undoPostAction(typeId) {
    const post = this.model;
    return post.get('actions_summary').findProperty('id', typeId).undo(post);
  },

  deferPostActionFlags(typeId) {
    const post = this.model;
    return post.get('actions_summary').findProperty('id', typeId).deferFlags(post);
  }
});
