import { moduleForWidget, widgetTest } from 'helpers/widget-test';

moduleForWidget('post');

widgetTest('basic elements', {
  template: '{{mount-widget widget="post" args=args}}',
  setup() {
    this.set('args', { shareUrl: '/example', post_number: 1 });
  },
  test(assert) {
    assert.ok(this.$('.names').length, 'includes poster name');

    assert.ok(this.$('a.post-date').length, 'includes post date');
    assert.ok(this.$('a.post-date[data-share-url]').length);
    assert.ok(this.$('a.post-date[data-post-number]').length);
  }
});

widgetTest('wiki', {
  template: '{{mount-widget widget="post" args=args editPost="editPost"}}',
  setup() {
    this.set('args', { wiki: true });
    this.on('editPost', () => this.editPostCalled = true);
  },
  test(assert) {
    click('.post-info.wiki');
    andThen(() => {
      assert.ok(this.editPostCalled, 'clicking the wiki icon edits the post');
    });
  }
});

widgetTest('via-email', {
  template: '{{mount-widget widget="post" args=args showRawEmail="showRawEmail"}}',
  setup() {
    this.set('args', { via_email: true, canViewRawEmail: true });
    this.on('showRawEmail', () => this.rawEmailShown = true);
  },
  test(assert) {
    click('.post-info.via-email');
    andThen(() => {
      assert.ok(this.rawEmailShown, 'clicking the enveloppe shows the raw email');
    });
  }
});

widgetTest('via-email without permission', {
  template: '{{mount-widget widget="post" args=args showRawEmail="showRawEmail"}}',
  setup() {
    this.set('args', { via_email: true, canViewRawEmail: false });
    this.on('showRawEmail', () => this.rawEmailShown = true);
  },
  test(assert) {
    click('.post-info.via-email');
    andThen(() => {
      assert.ok(!this.rawEmailShown, `clicking the enveloppe doesn't show the raw email`);
    });
  }
});

widgetTest('history', {
  template: '{{mount-widget widget="post" args=args showHistory="showHistory"}}',
  setup() {
    this.set('args', { version: 3, can_view_edit_history: true });
    this.on('showHistory', () => this.historyShown = true);
  },
  test(assert) {
    click('.post-info.edits');
    andThen(() => {
      assert.ok(this.historyShown, 'clicking the pencil shows the history');
    });
  }
});

widgetTest('history without view permission', {
  template: '{{mount-widget widget="post" args=args showHistory="showHistory"}}',
  setup() {
    this.set('args', { version: 3, can_view_edit_history: false });
    this.on('showHistory', () => this.historyShown = true);
  },
  test(assert) {
    click('.post-info.edits');
    andThen(() => {
      assert.ok(!this.historyShown, `clicking the pencil doesn't show the history`);
    });
  }
});

widgetTest('whisper', {
  template: '{{mount-widget widget="post" args=args}}',
  setup() {
    this.set('args', { isWhisper: true });
  },
  test(assert) {
    assert.ok(this.$('.topic-post.whisper').length === 1);
    assert.ok(this.$('.post-info.whisper').length === 1);
  }
});

widgetTest('like count button', {
  template: '{{mount-widget widget="post" model=post args=args}}',
  setup(store) {
    const topic = store.createRecord('topic', {id: 123});
    const post = store.createRecord('post', {
      id: 1,
      post_number: 1,
      topic,
      like_count: 3,
      actions_summary: [ {id: 2, count: 1, hidden: false, can_act: true} ]
    });
    this.set('post', post);
    this.set('args', { likeCount: 1 });
  },
  test(assert) {
    assert.ok(this.$('button.like-count').length === 1);
    assert.ok(this.$('.who-liked').length === 0);

    // toggle it on
    click('button.like-count');
    andThen(() => {
      assert.ok(this.$('.who-liked').length === 1);
      assert.ok(this.$('.who-liked a.trigger-user-card').length === 1);
    });

    // toggle it off
    click('button.like-count');
    andThen(() => {
      assert.ok(this.$('.who-liked').length === 0);
      assert.ok(this.$('.who-liked a.trigger-user-card').length === 0);
    });
  }
});

widgetTest(`like count with no likes`, {
  template: '{{mount-widget widget="post" model=post args=args}}',
  setup() {
    this.set('args', { likeCount: 0 });
  },
  test(assert) {
    assert.ok(this.$('button.like-count').length === 0);
  }
});

widgetTest('share button', {
  template: '{{mount-widget widget="post" args=args}}',
  setup() {
    this.set('args', { shareUrl: 'http://share-me.example.com' });
  },
  test(assert) {
    assert.ok(!!this.$('.actions button[data-share-url]').length, 'it renders a share button');
  }
});

widgetTest('liking', {
  template: '{{mount-widget widget="post-menu" args=args toggleLike="toggleLike"}}',
  setup() {
    const args = { showLike: true, canToggleLike: true };
    this.set('args', args);
    this.on('toggleLike', () => {
      args.liked = !args.liked;
      args.likeCount = args.liked ? 1 : 0;
    });
  },
  test(assert) {
    assert.ok(!!this.$('.actions button.like').length);
    assert.ok(this.$('.actions button.like-count').length === 0);

    click('.actions button.like');
    andThen(() => {
      assert.ok(!this.$('.actions button.like').length);
      assert.ok(!!this.$('.actions button.has-like').length);
      assert.ok(this.$('.actions button.like-count').length === 1);
    });

    click('.actions button.has-like');
    andThen(() => {
      assert.ok(!!this.$('.actions button.like').length);
      assert.ok(!this.$('.actions button.has-like').length);
      assert.ok(this.$('.actions button.like-count').length === 0);
    });
  }
});

widgetTest('edit button', {
  template: '{{mount-widget widget="post" args=args editPost="editPost"}}',
  setup() {
    this.set('args', { canEdit: true });
    this.on('editPost', () => this.editPostCalled = true);
  },
  test(assert) {
    click('button.edit');
    andThen(() => {
      assert.ok(this.editPostCalled, 'it triggered the edit action');
    });
  }
});

widgetTest(`edit button - can't edit`, {
  template: '{{mount-widget widget="post" args=args editPost="editPost"}}',
  setup() {
    this.set('args', { canEdit: false });
  },
  test(assert) {
    assert.equal(this.$('button.edit').length, 0, `button is not displayed`);
  }
});

widgetTest('delete button', {
  template: '{{mount-widget widget="post" args=args deletePost="deletePost"}}',
  setup() {
    this.set('args', { can_delete: true });
    this.on('deletePost', () => this.deletePostCalled = true);
  },
  test(assert) {
    click('button.delete');
    andThen(() => {
      assert.ok(this.deletePostCalled, 'it triggered the delete action');
    });
  }
});

widgetTest(`delete button - can't delete`, {
  template: '{{mount-widget widget="post" args=args}}',
  setup() {
    this.set('args', { can_delete: false });
  },
  test(assert) {
    assert.equal(this.$('button.delete').length, 0, `button is not displayed`);
  }
});

widgetTest(`flagging`, {
  template: '{{mount-widget widget="post" args=args showFlags="showFlags"}}',
  setup() {
    this.set('args', { canFlag: true });
    this.on('showFlags', () => this.flagsShown = true);
  },
  test(assert) {
    assert.ok(this.$('button.create-flag').length === 1);

    click('button.create-flag');
    andThen(() => {
      assert.ok(this.flagsShown, 'it triggered the action');
    });
  }
});

widgetTest(`flagging: can't flag`, {
  template: '{{mount-widget widget="post" args=args}}',
  setup() {
    this.set('args', { canFlag: false });
  },
  test(assert) {
    assert.ok(this.$('button.create-flag').length === 0);
  }
});

widgetTest(`read indicator`, {
  template: '{{mount-widget widget="post" args=args}}',
  setup() {
    this.set('args', { read: true });
  },
  test(assert) {
    assert.ok(this.$('.read-state.read').length);
  }
});

widgetTest(`unread indicator`, {
  template: '{{mount-widget widget="post" args=args}}',
  setup() {
    this.set('args', { read: false });
  },
  test(assert) {
    assert.ok(this.$('.read-state').length);
  }
});

widgetTest("reply directly above (supressed)", {
  template: '{{mount-widget widget="post" args=args}}',
  setup() {
    this.set('args', {
      post_number: 2,
      replyToUsername: 'eviltrout',
      replyToAvatarTemplate: '/images/avatar.png',
      reply_to_post_number: 1
    });
  },
  test(assert) {
    assert.equal(this.$('a.reply-to-tab').length, 0, 'hides the tab');
  }
});

widgetTest("reply a few posts above (supressed)", {
  template: '{{mount-widget widget="post" args=args}}',
  setup() {
    this.set('args', {
      post_number: 5,
      replyToUsername: 'eviltrout',
      replyToAvatarTemplate: '/images/avatar.png',
      reply_to_post_number: 1
    });
  },
  test(assert) {
    assert.ok(this.$('a.reply-to-tab').length, 'shows the tab');
  }
});

widgetTest("reply directly above (not supressed)", {
  template: '{{mount-widget widget="post" args=args}}',
  setup() {
    this.set('args', {
      post_number: 2,
      replyToUsername: 'eviltrout',
      replyToAvatarTemplate: '/images/avatar.png',
      reply_to_post_number: 1
    });
    this.siteSettings.suppress_reply_directly_above = false;
  },
  test(assert) {
    assert.ok(this.$('a.reply-to-tab').length, 'shows the tab');
  }
});
