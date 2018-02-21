/**
 * @license
 * Visual Blocks Editor
 *
 * Copyright 2015 Google Inc.
 * https://developers.google.com/blockly/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Object representing a search.
 * @author hideo.sup@gmail.com
 */
'use strict';

goog.provide('Blockly.Search');

/**
 * Search filters.
 * @type {!Array.<string>}
 * @private
 */
Blockly.Search.FILTERS = [];

/**
 * Construct the elements (result blocks and button) used by the flyout for the search category.
 * @param {!Blockly.Workspace} workspace The workspace containing the search.
 * @return {!Array.<!Element>} Array of XML elements.
 */
Blockly.Search.flyoutCategory = function(workspace) {
  var xmlList = [];

  var button = goog.dom.createDom('button');
  var text = Blockly.Search.FILTERS.length === 0
    ? Blockly.Msg.SEARCH_BUTTON
    : Blockly.Msg.SEARCHING_BUTTON + '"' + Blockly.Search.getFiltersString() + '"';
  button.setAttribute('text', text);
  button.setAttribute('callbackKey', 'SEARCH');

  workspace.registerButtonCallback('SEARCH', function(button) {
    Blockly.Search.createFilters(button.getTargetWorkspace());
  });

  xmlList.push(button);

  if (Blockly.Search.FILTERS.length > 0) {
    var blockList = Blockly.Search.flyoutCategoryBlocks(workspace);
    if (blockList.length > 0) {
      xmlList = xmlList.concat(blockList);
    }
  }

  return xmlList;
};

/**
 * Construct the search results blocks in the flyout for the search category.
 * @param {!Blockly.Workspace} workspace The workspace containing the search.
 * @return {!Array.<!Element>} Array of XML block elements.
 */
Blockly.Search.flyoutCategoryBlocks = function(workspace) {
  var xmlList = [];
  if (Blockly.Search.FILTERS.length > 0) {
    var blocks = Blockly.Search.getSearchableBlocks(workspace.toolbox_.tree_, workspace);
    for (var i = 0; i < blocks.length; i++) {
      var block = blocks[i];
      if (block.search(Blockly.Search.FILTERS)) {
        xmlList.push(Blockly.Xml.blockToDom(block));
        block.dispose(false);
      }
    }
  }
  return xmlList;
};

/**
 * Gets all searchable blocks.
 * @param {!Blockly.Toolbox.TreeControl} tree The current tree.
 * @param {!Blockly.Workspace} workspace The workspace containing the search.
 * @param {Blockly.Workspace} headlessWorkspace An headless workspace used to render blocks.
 * @return {!Array.<!Blockly.BlockSvg>} Array of headless blocks containing the searchable blocks.
 */
Blockly.Search.getSearchableBlocks = function(tree, workspace, headlessWorkspace) {
  var blocks = [];
  if (!headlessWorkspace) {
    headlessWorkspace = new Blockly.Workspace();
    blocks = blocks.concat(Blockly.Procedures.flyoutCategory(workspace).map(function(block) {
      return Blockly.Xml.domToBlock(block, headlessWorkspace);
    }));
    blocks = blocks.concat(Blockly.Variables.flyoutCategory(workspace).filter(function(block){
      return block.tagName.toUpperCase() === 'BLOCK';
    }).map(function(block) {
      return Blockly.Xml.domToBlock(block, headlessWorkspace);
    }));
  }
  if (!tree.hasChildren()) return blocks;
  var children = tree.getChildren();
  for (var i = 0; i < children.length; i++) {
    var child = children[i];
    if (child.blocks && child.blocks.length > 0) {
      for (var j = 0; j < child.blocks.length; j++) {
        var block = child.blocks[j];
        if (typeof block === 'string' || block.tagName.toUpperCase() !== 'BLOCK') {
          continue;
        }
        blocks.push(Blockly.Xml.domToBlock(block, headlessWorkspace));
      }
    }
    blocks = blocks.concat(Blockly.Search.getSearchableBlocks(child, workspace, headlessWorkspace));
  }
  return blocks;
};

/**
 * Create new filters on the given workspace.
 * @param {!Blockly.Workspace} workspace The workspace on which to create the
 *     variable.
 */
Blockly.Search.createFilters = function(workspace) {
  Blockly.Search.promptFilters(Blockly.Msg.SEARCH_PROMPT, Blockly.Search.getFiltersString(),
    function(newFilters) {
      if (newFilters !== null) {
        Blockly.Search.setFilters(newFilters);
        workspace.refreshToolboxSelection_();
      }
    });
};


/**
 * Prompt the user for new filters.
 * @param {string} promptText The string of the prompt.
 * @param {string} defaultText The default value to show in the prompt's field.
 * @param {function(?string)} callback A callback. It will return the new filters, or null if the user picked something
 *     illegal or cancel out of it.
 */
Blockly.Search.promptFilters = function(promptText, defaultText, callback) {
  Blockly.prompt(promptText, defaultText, function(newFilters) {
    callback(newFilters);
  });
};

/**
 * Set the filters.
 * @param {!String} filters Search filters.
 */
Blockly.Search.setFilters = function(filters) {
  var filterString = filters.trim().toLowerCase();
  Blockly.Search.FILTERS = filterString.length > 0 ? filterString.split(' ') : [];
};

/**
 * Get the filters associated string.
 * @return {String} The filters string.
 */
Blockly.Search.getFiltersString = function() {
  return Blockly.Search.FILTERS.join(' ');
};
