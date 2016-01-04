import { createWidget } from 'discourse/widgets/widget';

function actionDescription(action, acted, count) {
  if (acted) {
    if (count <= 1) {
      return I18n.t(`post.actions.by_you.${action}`);
    } else {
      return I18n.t(`post.actions.by_you_and_others.${action}`, { count: count - 1 });
    }
  } else {
    return I18n.t(`post.actions.by_others.${action}`, { count });
  }
}

export default createWidget('post-stream', {
  tagName: 'div.post-stream',

  transformPost(post) {

    // Note: it can be dangerous to not use `get` in Ember code, but this is significantly
    // faster and has tests to confirm it works. We only call `get` when the property is a CP
    const postType = post.post_type;
    const postTypes = this.site.post_types;
    const topic = post.topic;
    const details = topic.get('details');
    const currentUser = this.currentUser;

    const postAtts = {
      id: post.id,
      topicOwner: details.created_by.id === post.user_id,
      hidden: post.hidden,
      deleted: post.get('deleted'),
      deleted_at: post.deleted_at,
      user_deleted: post.user_deleted,
      isDeleted: post.deleted_at || post.user_deleted,
      deletedByAvatarTemplate: null,
      deletedByUsername: null,
      can_delete: false,
      primary_group_name: post.primary_group_name,
      wiki: post.wiki,
      post_type: postType,
      firstPost: post.post_number === 1,
      post_number: post.post_number,
      cooked: post.cooked,
      via_email: post.via_email,
      user_id: post.user_id,
      usernameUrl: Discourse.getURL(`/users/${post.username}`),
      username: post.username,
      avatar_template: post.avatar_template,
      bookmarked: post.bookmarked,
      yours: post.yours,
      shareUrl: post.get('shareUrl'),
      bookmarked: post.bookmarked,
      can_delete: post.can_delete,
      can_recover: post.can_recover,
      staff: post.staff,
      admin: post.admin,
      moderator: post.moderator,
      new_user: post.trust_level === 0,
      name: post.name,
      user_title: post.user_title,
      created_at: post.created_at,
      updated_at: post.updated_at,
      isModeratorAction: postType === postTypes.moderator_action,
      isWhisper: postType === postTypes.whisper,
      canEdit: post.can_edit,
      canCreatePost: this.attrs.canCreatePost,
      canBookmark: !!currentUser,
      canFlag: !Ember.isEmpty(post.flagsAvailable),
      canManage: currentUser && currentUser.get('canManageTopic'),
      canViewRawEmail: currentUser && (currentUser.id === post.user_id || currentUser.staff),
      isWarning: topic.is_warning,
      version: post.version,
      canRecoverTopic: false,
      canDeletedTopic: false,
      can_recover: false,
      showLike: false,
      liked: false,
      canToggleLike: false,
      likeCount: false,
      can_view_edit_history: post.can_view_edit_history,
      actionsSummary: null,
      read: post.read,
      replyToUsername: null,
      replyToAvatarTemplate: null,
      reply_to_post_number: post.reply_to_post_number
    };

    if (postAtts.isDeleted) {
      postAtts.deletedByAvatarTemplate = post.get('postDeletedBy.avatar_template');
      postAtts.deletedByUsername = post.get('postDeletedBy.username');
    }

    const replyToUser = post.get('reply_to_user');
    if (replyToUser) {
      postAtts.replyToUsername = replyToUser.username;
      postAtts.replyToAvatarTemplate = replyToUser.avatar_template;
    }

    if (post.actions_summary) {
      postAtts.actionsSummary = post.actions_summary.filter(a => {
        return a.actionType.name_key !== 'like' && a.count > 0;
      }).map(a => {
        const acted = a.acted;
        const action = a.actionType.name_key;
        const count = a.count;

        return { id: a.id,
                 postId: post.id,
                 action,
                 acted,
                 count,
                 canUndo: a.can_undo,
                 canDeferFlags: a.can_defer_flags,
                 description: actionDescription(action, acted, count) };
      });
    }

    const likeAction = post.likeAction;
    if (likeAction) {
      postAtts.showLike = true;
      postAtts.liked = likeAction.acted;
      postAtts.canToggleLike = likeAction.get('canToggle');
      postAtts.likeCount = likeAction.count;
    }

    if (postAtts.post_number === 1) {
      postAtts.canRecoverTopic = topic.deleted_at && details.can_recover;
      postAtts.canDeleteTopic = !topic.deleted_at && details.can_delete;
    } else {
      postAtts.can_recover = postAtts.isDeleted && postAtts.can_recover;
      postAtts.can_delete = !postAtts.isDeleted && postAtts.can_delete;
    }

    return postAtts;
  },

  html(attrs) {
    const posts = attrs.posts || [];
    const result = posts.map(p => {
      const widget = this.attach('post', this.transformPost(p), { model: p });
      return widget;
    });
    return result;
  }
});
